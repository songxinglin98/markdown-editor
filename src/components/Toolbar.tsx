import React from "react";

interface ToolbarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onFormat: (prefix: string, suffix?: string, placeholder?: string) => void;
  isModified: boolean;
}

const formatButtons = [
  { label: "B", title: "Bold", prefix: "**", suffix: "**", placeholder: "bold text", cls: "font-bold" },
  { label: "I", title: "Italic", prefix: "*", suffix: "*", placeholder: "italic text", cls: "italic" },
  { label: "H1", title: "Heading 1", prefix: "# ", suffix: "", placeholder: "Heading 1" },
  { label: "H2", title: "Heading 2", prefix: "## ", suffix: "", placeholder: "Heading 2" },
  { label: "H3", title: "Heading 3", prefix: "### ", suffix: "", placeholder: "Heading 3" },
  { label: "</>", title: "Inline Code", prefix: "`", suffix: "`", placeholder: "code" },
  { label: "```", title: "Code Block", prefix: "```\n", suffix: "\n```", placeholder: "code here" },
  { label: ">", title: "Blockquote", prefix: "> ", suffix: "", placeholder: "quote" },
  { label: "—", title: "Horizontal Rule", prefix: "\n---\n", suffix: "", placeholder: "" },
  { label: "• List", title: "Bullet List", prefix: "- ", suffix: "", placeholder: "item" },
  { label: "1. List", title: "Ordered List", prefix: "1. ", suffix: "", placeholder: "item" },
  { label: "🔗", title: "Link", prefix: "[", suffix: "](url)", placeholder: "link text" },
];

const Toolbar: React.FC<ToolbarProps> = ({
  onNew, onOpen, onSave, onSaveAs, onFormat, isModified,
}) => {
  const btnBase = "px-3 py-1.5 text-xs font-medium bg-white dark:bg-[#3c3c3c] border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-[#4c4c4c] active:bg-gray-100 dark:active:bg-[#505050] transition-colors cursor-pointer select-none";
  const fmtBtn = "px-2 py-1 text-xs font-medium bg-white dark:bg-[#3c3c3c] border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-[#4c4c4c] active:bg-gray-100 dark:active:bg-[#505050] transition-colors cursor-pointer select-none";

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
            key={btn.title}
            className={`${fmtBtn} ${btn.cls ?? ""}`}
            title={btn.title}
            onClick={() => onFormat(btn.prefix, btn.suffix, btn.placeholder)}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toolbar;
