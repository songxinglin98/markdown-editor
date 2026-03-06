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
  { label: "B",      title: "Bold",           prefix: "**",     suffix: "**",   placeholder: "bold text",   cls: "fmt-bold" },
  { label: "I",      title: "Italic",         prefix: "*",      suffix: "*",    placeholder: "italic text", cls: "fmt-italic" },
  { label: "H1",     title: "Heading 1",      prefix: "# ",     suffix: "",     placeholder: "Heading 1" },
  { label: "H2",     title: "Heading 2",      prefix: "## ",    suffix: "",     placeholder: "Heading 2" },
  { label: "H3",     title: "Heading 3",      prefix: "### ",   suffix: "",     placeholder: "Heading 3" },
  { label: "</>",    title: "Inline Code",    prefix: "`",      suffix: "`",    placeholder: "code" },
  { label: "```",    title: "Code Block",     prefix: "```\n",  suffix: "\n```", placeholder: "code here" },
  { label: ">",      title: "Blockquote",     prefix: "> ",     suffix: "",     placeholder: "quote" },
  { label: "—",      title: "Horizontal Rule",prefix: "\n---\n",suffix: "",     placeholder: "" },
  { label: "• List", title: "Bullet List",    prefix: "- ",     suffix: "",     placeholder: "item" },
  { label: "1. List",title: "Ordered List",   prefix: "1. ",    suffix: "",     placeholder: "item" },
  { label: "🔗",     title: "Link",           prefix: "[",      suffix: "](url)", placeholder: "link text" },
];

const Toolbar: React.FC<ToolbarProps> = ({
  onNew, onOpen, onSave, onSaveAs, onFormat, isModified,
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={onNew} title="New File (⌘N)">
          New
        </button>
        <button className="toolbar-btn" onClick={onOpen} title="Open File (⌘O)">
          Open
        </button>
        <button
          className={`toolbar-btn ${isModified ? "toolbar-btn--modified" : ""}`}
          onClick={onSave}
          title="Save (⌘S)"
        >
          Save{isModified ? " ●" : ""}
        </button>
        <button className="toolbar-btn" onClick={onSaveAs} title="Save As">
          Save As
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group toolbar-group--format">
        {formatButtons.map((btn) => (
          <button
            key={btn.title}
            className={`toolbar-btn toolbar-btn--fmt ${btn.cls ?? ""}`}
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
