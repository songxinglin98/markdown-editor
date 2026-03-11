import { useState, useRef, useEffect, useCallback } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import printStyles from "./styles/print.css?raw";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { tempDir } from "@tauri-apps/api/path";
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

  // Export to PDF using system browser print (Typora-like high quality)
  const handleExportPDF = useCallback(async () => {
    const editorEl = document.querySelector(".milkdown-editor-wrapper .editor");
    if (!editorEl) {
      console.error("Editor element not found");
      return;
    }

    setIsExporting(true);

    try {
      // Get document title for the PDF
      const docTitle = filePath
        ? filePath.split("/").pop()!.replace(/\.(md|markdown|txt)$/, "")
        : "Untitled";

      // Build the print HTML with Typora-like styling
      const printHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${docTitle} - Print to PDF</title>
  <style>${printStyles}</style>
  <script>
    // Auto-trigger print dialog when page loads
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</head>
<body>
  <div class="print-instructions">
    <strong>📄 Export to PDF</strong>
    Press <kbd>⌘</kbd> + <kbd>P</kbd> (Mac) or <kbd>Ctrl</kbd> + <kbd>P</kbd> (Windows) to print.<br>
    In the print dialog, select <strong>"Save as PDF"</strong> as the destination.
  </div>
  <div class="print-content">
    ${editorEl.innerHTML}
  </div>
</body>
</html>`;

      // Save HTML to temp directory and open in system browser
      const tmpDir = await tempDir();
      const htmlPath = `${tmpDir}${docTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}_print.html`;

      await writeTextFile(htmlPath, printHTML);
      // Use our custom Rust command to open the file
      await invoke("open_file_in_browser", { path: htmlPath });

      console.log("Opened print preview in system browser:", htmlPath);
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