import React, { useMemo, useEffect, useState } from "react";

interface TocItem {
  level: number;
  text: string;
  id: string;
}

interface TableOfContentsProps {
  content: string;
  onHeadingClick: (id: string) => void;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ content, onHeadingClick }) => {
  const [headings, setHeadings] = useState<TocItem[]>([]);

  // Parse headings from markdown content (as backup) and also from DOM
  const markdownHeadings = useMemo(() => {
    const lines = content.split("\n");
    const result: TocItem[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
      // Track code blocks to avoid parsing headings inside them
      if (line.trim().startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) continue;

      // Match headings (# to ######)
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        // Create a simple ID from the text
        const id = text
          .toLowerCase()
          .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");

        result.push({ level, text, id });
      }
    }

    return result;
  }, [content]);

  // Also extract headings from DOM for WYSIWYG mode
  useEffect(() => {
    const extractFromDOM = () => {
      const editorEl = document.querySelector(".milkdown-editor-wrapper");
      if (!editorEl) {
        setHeadings(markdownHeadings);
        return;
      }

      const domHeadings = editorEl.querySelectorAll("h1, h2, h3, h4, h5, h6");
      if (domHeadings.length === 0) {
        setHeadings(markdownHeadings);
        return;
      }

      const result: TocItem[] = [];
      domHeadings.forEach((el) => {
        const level = parseInt(el.tagName.charAt(1), 10);
        const text = el.textContent?.trim() || "";
        if (text) {
          const id = text
            .toLowerCase()
            .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
          result.push({ level, text, id });
        }
      });

      setHeadings(result.length > 0 ? result : markdownHeadings);
    };

    // Initial extraction
    const timer = setTimeout(extractFromDOM, 100);

    // Re-extract when content changes
    return () => clearTimeout(timer);
  }, [content, markdownHeadings]);

  if (headings.length === 0) {
    return (
      <div className="w-56 shrink-0 bg-gray-50 dark:bg-[#252526] border-r border-gray-200 dark:border-gray-700 p-4 overflow-auto">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          目录
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          暂无标题
        </p>
      </div>
    );
  }

  // Find minimum heading level to normalize indentation
  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <div className="w-56 shrink-0 bg-gray-50 dark:bg-[#252526] border-r border-gray-200 dark:border-gray-700 overflow-auto">
      <div className="sticky top-0 bg-gray-50 dark:bg-[#252526] p-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          📑 目录
        </h3>
      </div>
      <nav className="p-2">
        <ul className="space-y-0.5">
          {headings.map((heading, index) => {
            const indent = (heading.level - minLevel) * 12;
            return (
              <li key={`${heading.id}-${index}`}>
                <button
                  onClick={() => onHeadingClick(heading.text)}
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-200 dark:hover:bg-[#3c3c3c] transition-colors truncate group"
                  style={{ paddingLeft: `${8 + indent}px` }}
                  title={heading.text}
                >
                  <span className="text-gray-400 dark:text-gray-500 mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {heading.level === 1 ? "H1" : heading.level === 2 ? "H2" : heading.level === 3 ? "H3" : `H${heading.level}`}
                  </span>
                  <span
                    className={`${heading.level === 1
                      ? "font-semibold text-gray-800 dark:text-gray-200"
                      : heading.level === 2
                        ? "font-medium text-gray-700 dark:text-gray-300"
                        : "text-gray-600 dark:text-gray-400"
                      }`}
                  >
                    {heading.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default TableOfContents;