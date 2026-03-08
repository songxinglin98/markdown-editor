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
      cloneContainer.style.position = "absolute";
      cloneContainer.style.left = "-9999px";
      cloneContainer.style.top = "0";
      cloneContainer.style.width = "800px";
      cloneContainer.style.padding = "40px";
      cloneContainer.style.backgroundColor = "#ffffff";
      cloneContainer.style.color = "#1a1a1a";
      cloneContainer.innerHTML = editorEl.innerHTML;
      document.body.appendChild(cloneContainer);

      // Style the clone for better PDF output
      const style = document.createElement("style");
      style.textContent = `
        .milkdown h1 { font-size: 28px; font-weight: bold; margin: 24px 0 16px; color: #1a1a1a; }
        .milkdown h2 { font-size: 24px; font-weight: bold; margin: 20px 0 12px; color: #1a1a1a; }
        .milkdown h3 { font-size: 20px; font-weight: bold; margin: 16px 0 10px; color: #1a1a1a; }
        .milkdown p { font-size: 14px; line-height: 1.6; margin: 8px 0; color: #333; }
        .milkdown ul, .milkdown ol { margin: 8px 0; padding-left: 24px; }
        .milkdown li { font-size: 14px; line-height: 1.6; color: #333; }
        .milkdown code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        .milkdown pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow: auto; }
        .milkdown blockquote { border-left: 4px solid #ddd; padding-left: 16px; margin: 12px 0; color: #666; }
        .milkdown hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
        .milkdown a { color: #0066cc; text-decoration: underline; }
        .milkdown strong { font-weight: bold; }
        .milkdown em { font-style: italic; }
      `;
      cloneContainer.appendChild(style);

      // Generate canvas from the clone
      const canvas = await html2canvas(cloneContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
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