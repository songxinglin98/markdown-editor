import { useState, useRef, useEffect, useCallback } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile, writeFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Toolbar from "./components/Toolbar";
import TableOfContents from "./components/TableOfContents";
import MilkdownEditor, { MilkdownEditorHandle } from "./components/MilkdownEditor";
import "./App.css";

const DEMO = `# Welcome to Markdown Editor

This is a **simple** and *elegant* Markdown editor built with Tauri + React.

## Features

- Split-pane live preview
- Syntax highlighted code blocks
- Open / Save files
- Formatting toolbar
- Keyboard shortcuts: ⌘N, ⌘O, ⌘S

## Code Example

\`\`\`typescript
const greet = (name: string): string => {
  return \`Hello, \${name}!\`;
};
\`\`\`

## Blockquote

> Start writing something amazing...

---

Happy writing! 🎉
`;

function App() {
  const [content, setContent] = useState(DEMO);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const editorRef = useRef<MilkdownEditorHandle>(null);

  const updateTitle = useCallback(async (path: string | null, modified: boolean) => {
    const name = path ? path.split("/").pop()! : "Untitled";
    await getCurrentWindow().setTitle(`${modified ? "● " : ""}${name} — Markdown Editor`);
  }, []);

  const markModified = useCallback((val: string) => {
    setContent(val);
    setIsModified(true);
    updateTitle(filePath, true);
  }, [filePath, updateTitle]);

  const handleNew = useCallback(async () => {
    setContent("");
    setFilePath(null);
    setIsModified(false);
    await updateTitle(null, false);
  }, [updateTitle]);

  const openFile = useCallback(async (path: string) => {
    try {
      const text = await readTextFile(path);
      setContent(text);
      setFilePath(path);
      setIsModified(false);
      await updateTitle(path, false);
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  }, [updateTitle]);

  const handleOpen = useCallback(async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
    });
    if (!selected) return;
    await openFile(selected as string);
  }, [openFile]);

  const handleSave = useCallback(async () => {
    if (filePath) {
      await writeTextFile(filePath, content);
      setIsModified(false);
      await updateTitle(filePath, false);
    } else {
      const savePath = await save({
        filters: [{ name: "Markdown", extensions: ["md"] }],
        defaultPath: "untitled.md",
      });
      if (!savePath) return;
      await writeTextFile(savePath, content);
      setFilePath(savePath);
      setIsModified(false);
      await updateTitle(savePath, false);
    }
  }, [filePath, content, updateTitle]);

  const handleSaveAs = useCallback(async () => {
    const savePath = await save({
      filters: [{ name: "Markdown", extensions: ["md"] }],
      defaultPath: filePath ?? "untitled.md",
    });
    if (!savePath) return;
    await writeTextFile(savePath, content);
    setFilePath(savePath);
    setIsModified(false);
    await updateTitle(savePath, false);
  }, [filePath, content, updateTitle]);

  // Export to PDF
  const handleExportPDF = useCallback(async () => {
    const editorEl = document.querySelector(".milkdown-editor-wrapper");
    if (!editorEl) {
      console.error("Editor element not found");
      return;
    }

    setIsExporting(true);

    try {
      // Get the default filename
      const defaultName = filePath
        ? filePath.split("/").pop()!.replace(/\.(md|markdown|txt)$/, ".pdf")
        : "untitled.pdf";

      // Ask user where to save
      const savePath = await save({
        filters: [{ name: "PDF", extensions: ["pdf"] }],
        defaultPath: defaultName,
      });

      if (!savePath) {
        setIsExporting(false);
        return;
      }

      // Create a clone of the editor content for PDF generation
      const cloneContainer = document.createElement("div");
      cloneContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 800px;
        padding: 40px;
        background-color: #ffffff;
        color: #1a1a1a;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      cloneContainer.innerHTML = editorEl.innerHTML;
      document.body.appendChild(cloneContainer);

      // Remove all oklch color references by applying inline styles
      const allElements = cloneContainer.querySelectorAll("*");
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        // Reset colors to safe RGB values
        htmlEl.style.color = "#1a1a1a";
        htmlEl.style.backgroundColor = "transparent";
        htmlEl.style.borderColor = "#dddddd";
      });

      // Style the clone for better PDF output with all RGB colors
      const style = document.createElement("style");
      style.textContent = `
        * { color: #1a1a1a !important; background-color: transparent !important; }
        h1 { font-size: 28px !important; font-weight: bold !important; margin: 24px 0 16px !important; }
        h2 { font-size: 24px !important; font-weight: bold !important; margin: 20px 0 12px !important; }
        h3 { font-size: 20px !important; font-weight: bold !important; margin: 16px 0 10px !important; }
        h4 { font-size: 18px !important; font-weight: bold !important; margin: 14px 0 8px !important; }
        h5 { font-size: 16px !important; font-weight: bold !important; margin: 12px 0 6px !important; }
        h6 { font-size: 14px !important; font-weight: bold !important; margin: 10px 0 4px !important; }
        p { font-size: 14px !important; line-height: 1.6 !important; margin: 8px 0 !important; }
        ul, ol { margin: 8px 0 !important; padding-left: 24px !important; }
        li { font-size: 14px !important; line-height: 1.6 !important; }
        code { background: #f5f5f5 !important; padding: 2px 6px !important; border-radius: 4px !important; font-family: monospace !important; color: #333 !important; }
        pre { background: #f5f5f5 !important; padding: 16px !important; border-radius: 8px !important; overflow: auto !important; }
        pre code { background: transparent !important; padding: 0 !important; }
        blockquote { border-left: 4px solid #dddddd !important; padding-left: 16px !important; margin: 12px 0 !important; color: #666666 !important; }
        hr { border: none !important; border-top: 1px solid #dddddd !important; margin: 16px 0 !important; }
        a { color: #0066cc !important; text-decoration: underline !important; }
        strong { font-weight: bold !important; }
        em { font-style: italic !important; }
        table { border-collapse: collapse !important; width: 100% !important; margin: 12px 0 !important; }
        th, td { border: 1px solid #dddddd !important; padding: 8px !important; text-align: left !important; }
        th { background: #f5f5f5 !important; font-weight: bold !important; }
      `;
      cloneContainer.appendChild(style);

      // Generate canvas from the clone
      const canvas = await html2canvas(cloneContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        removeContainer: false,
      });

      // Remove the clone
      document.body.removeChild(cloneContainer);

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;

      // Handle multi-page PDF
      const pageHeight = pdfHeight * (imgWidth / pdfWidth);
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", imgX, position * ratio, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", imgX, position * ratio, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pageHeight;
      }

      // Get PDF as array buffer and save using Tauri
      const pdfOutput = pdf.output("arraybuffer");
      await writeFile(savePath, new Uint8Array(pdfOutput));

      console.log("PDF exported successfully to:", savePath);
    } catch (err) {
      console.error("Failed to export PDF:", err);
    } finally {
      setIsExporting(false);
    }
  }, [filePath]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "s") { e.preventDefault(); handleSave(); }
      if (e.key === "o") { e.preventDefault(); handleOpen(); }
      if (e.key === "n") { e.preventDefault(); handleNew(); }
      if (e.key === "e") { e.preventDefault(); handleExportPDF(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, handleOpen, handleNew, handleExportPDF]);

  // Commands for the toolbar
  const handleToolbarCommand = useCallback((command: string) => {
    const editor = editorRef.current;

    switch (command) {
      case "bold":
        editor?.toggleBold();
        break;
      case "italic":
        editor?.toggleItalic();
        break;
      case "h1":
        editor?.insertHeading(1);
        break;
      case "h2":
        editor?.insertHeading(2);
        break;
      case "h3":
        editor?.insertHeading(3);
        break;
      case "code":
        editor?.insertInlineCode();
        break;
      case "codeblock":
        editor?.insertCodeBlock();
        break;
      case "quote":
        editor?.insertBlockquote();
        break;
      case "hr":
        editor?.insertHorizontalRule();
        break;
      case "bullet":
        editor?.insertBulletList();
        break;
      case "ordered":
        editor?.insertOrderedList();
        break;
      case "link":
        editor?.insertLink();
        break;
      case "toc":
        setShowToc(!showToc);
        break;
      case "exportPdf":
        handleExportPDF();
        break;
    }
  }, [showToc, handleExportPDF]);

  // Handle heading click from TOC
  const handleHeadingClick = useCallback((headingId: string) => {
    editorRef.current?.scrollToHeading(headingId);
  }, []);

  const fileName = filePath ? filePath.split("/").pop()! : "Untitled";
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-300 font-sans text-sm antialiased">
      <Toolbar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onCommand={handleToolbarCommand}
        isModified={isModified}
        showToc={showToc}
        isExporting={isExporting}
      />
      <div className="flex flex-1 overflow-hidden border-t border-gray-200 dark:border-gray-700">
        {showToc && (
          <TableOfContents content={content} onHeadingClick={handleHeadingClick} />
        )}
        <MilkdownEditor ref={editorRef} content={content} onChange={markModified} />
      </div>
      <div className="flex justify-between items-center px-3.5 py-1 bg-gray-100 dark:bg-[#007acc] border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-indigo-100 shrink-0 select-none">
        <span>
          {isModified ? "● " : ""}{fileName}
        </span>
        <span>
          {wordCount} words · {charCount} chars
        </span>
      </div>
    </div>
  );
}

export default App;