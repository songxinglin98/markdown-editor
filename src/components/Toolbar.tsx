import React from "react";

interface ToolbarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onCommand: (command: string) => void;
  isModified: boolean;
  showToc: boolean;
}

const formatButtons = [
  { label: "B", title: "Bold (⌘B)", command: "bold", cls: "font-bold" },
  { label: "I", title: "Italic (⌘I)", command: "italic", cls: "italic" },
  { label: "H1", title: "Heading 1", command: "h1" },
  { label: "H2", title: "Heading 2", command: "h2" },
  { label: "H3", title: "Heading 3", command: "h3" },
  { label: "</>", title: "Inline Code", command: "code" },
  { label: "```", title: "Code Block", command: "codeblock" },
  { label: ">", title: "Blockquote", command: "quote" },
  { label: "—", title: "Horizontal Rule", command: "hr" },
  { label: "• List", title: "Bullet List", command: "bullet" },
  { label: "1. List", title: "Ordered List", command: "ordered" },
  { label: "🔗", title: "Link", command: "link" },
];

const Toolbar: React.FC<ToolbarProps> = ({
  onNew, onOpen, onSave, onSaveAs, onCommand, isModified, showToc,
}) => {
  const btnBase = "px-3 py-1.5 text-xs font-medium bg-white dark:bg-[#3c3c3c] border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-[#4c4c4c] active:bg-gray-100 dark:active:bg-[#505050] transition-colors cursor-pointer select-none";
  const fmtBtn = "px-2 py-1 text-xs font-medium bg-white dark:bg-[#3c3c3c] border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-[#4c4c4c] active:bg-gray-100 dark:active:bg-[#505050] transition-colors cursor-pointer select-none";
  const tocBtn = `px-2 py-1 text-xs font-medium border rounded transition-colors cursor-pointer select-none ${showToc
      ? "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"
      : "bg-white dark:bg-[#3c3c3c] border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#4c4c4c]"
    }`;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-[#252526] border-b border-gray-200 dark:border-gray-700 shrink-0 select-none">
      <div className="flex gap-1.5">
        <button className={btnBase} onClick={onNew} title="New File (⌘N)">
          New
        </button>
        <button className={btnBase} onClick={onOpen} title="Open File (⌘O)">
          Open
        </button>
        <button
          className={`${btnBase} ${isModified ? "text-blue-600 dark:text-blue-400" : ""}`}
          onClick={onSave}
          title="Save (⌘S)"
        >
          Save{isModified ? " ●" : ""}
        </button>
        <button className={btnBase} onClick={onSaveAs} title="Save As">
          Save As
        </button>
      </div>

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

      <div className="flex flex-wrap gap-1">
        {formatButtons.map((btn) => (
          <button
            key={btn.command}
            className={`${fmtBtn} ${btn.cls ?? ""}`}
            title={btn.title}
            onClick={() => onCommand(btn.command)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

      <button
        className={tocBtn}
        title="Toggle Table of Contents"
        onClick={() => onCommand("toc")}
      >
        📑 TOC
      </button>
    </div>
  );
};

export default Toolbar;