import React, { useMemo } from "react";

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
  // Parse headings from markdown content
  const headings = useMemo(() => {
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
          .replace(/[^\w\s\u4e00-\u9fff-]/g, "") // Keep Chinese chars, alphanumeric, spaces, hyphens
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");

        result.push({ level, text, id });
      }
    }

    return result;
  }, [content]);

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
          目录
        </h3>
      </div>
      <nav className="p-2">
        <ul className="space-y-0.5">
          {headings.map((heading, index) => {
            const indent = (heading.level - minLevel) * 12;
            return (
              <li key={`${heading.id}-${index}`}>
                <button
                  onClick={() => onHeadingClick(heading.id)}
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-200 dark:hover:bg-[#3c3c3c] transition-colors truncate"
                  style={{ paddingLeft: `${8 + indent}px` }}
                  title={heading.text}
                >
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
