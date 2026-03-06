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
      <div className="flex flex-col flex-1 min-w-0 border-r border-gray-200 dark:border-gray-700">
        <div className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#2d2d2d] border-b border-gray-200 dark:border-gray-700 select-none">
          Editor
        </div>
        <textarea
          ref={ref}
          className="editor-textarea flex-1 w-full resize-none p-4 text-sm leading-relaxed bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-300 outline-none border-none"
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
