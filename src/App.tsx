import { useState, useRef, useEffect, useCallback } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Toolbar from "./components/Toolbar";
import Editor from "./components/Editor";
import Preview from "./components/Preview";
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
  const editorRef = useRef<HTMLTextAreaElement>(null);

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

  const handleOpen = useCallback(async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
    });
    if (!selected) return;
    const text = await readTextFile(selected as string);
    setContent(text);
    setFilePath(selected as string);
    setIsModified(false);
    await updateTitle(selected as string, false);
  }, [updateTitle]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "s") { e.preventDefault(); handleSave(); }
      if (e.key === "o") { e.preventDefault(); handleOpen(); }
      if (e.key === "n") { e.preventDefault(); handleNew(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, handleOpen, handleNew]);

  const insertFormat = useCallback(
    (prefix: string, suffix = "", placeholder = "") => {
      const el = editorRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = content.substring(start, end) || placeholder;
      const next =
        content.substring(0, start) + prefix + selected + suffix + content.substring(end);
      markModified(next);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      }, 0);
    },
    [content, markModified]
  );

  const fileName = filePath ? filePath.split("/").pop()! : "Untitled";
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="app">
      <Toolbar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onFormat={insertFormat}
        isModified={isModified}
      />
      <div className="editor-layout">
        <Editor ref={editorRef} content={content} onChange={markModified} />
        <Preview content={content} />
      </div>
      <div className="status-bar">
        <span className="status-filename">
          {isModified ? "● " : ""}{fileName}
        </span>
        <span className="status-stats">
          {wordCount} words · {charCount} chars
        </span>
      </div>
    </div>
  );
}

export default App;
