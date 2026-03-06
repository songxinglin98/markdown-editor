import React, { forwardRef } from "react";

interface EditorProps {
  content: string;
  onChange: (value: string) => void;
}

const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(
  ({ content, onChange }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const el = e.currentTarget;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const next = content.substring(0, start) + "  " + content.substring(end);
        onChange(next);
        setTimeout(() => el.setSelectionRange(start + 2, start + 2), 0);
      }
    };

    return (
      <div className="pane editor-pane">
        <div className="pane-header">Editor</div>
        <textarea
          ref={ref}
          className="editor-textarea"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder="Start writing Markdown here..."
        />
      </div>
    );
  }
);

Editor.displayName = "Editor";
export default Editor;
