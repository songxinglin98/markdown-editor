import React, { useState, useCallback } from "react";
import { readDir } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
}

interface FileTreeProps {
  onFileSelect: (path: string) => void;
  currentFile: string | null;
}

interface TreeNodeProps {
  entry: FileEntry;
  depth: number;
  onFileSelect: (path: string) => void;
  currentFile: string | null;
  onLoadChildren: (path: string) => Promise<FileEntry[]>;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  entry,
  depth,
  onFileSelect,
  currentFile,
  onLoadChildren,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<FileEntry[] | null>(entry.children || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!entry.isDirectory) {
      onFileSelect(entry.path);
      return;
    }

    if (!isExpanded && children === null) {
      setIsLoading(true);
      try {
        const loadedChildren = await onLoadChildren(entry.path);
        setChildren(loadedChildren);
      } catch (err) {
        console.error("Failed to load directory:", err);
        setChildren([]);
      }
      setIsLoading(false);
    }
    setIsExpanded(!isExpanded);
  };

  const isActive = currentFile === entry.path;
  const isMarkdown = /\.(md|markdown|txt)$/i.test(entry.name);

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2a2d2e] transition-colors ${isActive ? "bg-blue-100 dark:bg-[#094771] text-blue-900 dark:text-white" : ""
          }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleToggle}
      >
        {/* Expand/Collapse Icon */}
        {entry.isDirectory ? (
          <span className="w-4 h-4 flex items-center justify-center text-gray-400 dark:text-gray-500 shrink-0">
            {isLoading ? (
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg
                className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* File/Folder Icon */}
        <span className="shrink-0">
          {entry.isDirectory ? (
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
          ) : isMarkdown ? (
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>

        {/* File Name */}
        <span className="truncate text-xs">{entry.name}</span>
      </div>

      {/* Children */}
      {entry.isDirectory && isExpanded && children && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              currentFile={currentFile}
              onLoadChildren={onLoadChildren}
            />
          ))}
          {children.length === 0 && (
            <div
              className="text-xs text-gray-400 dark:text-gray-500 italic px-2 py-1"
              style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
            >
              Empty folder
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ onFileSelect, currentFile }) => {
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [rootEntries, setRootEntries] = useState<FileEntry[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const loadDirectory = useCallback(async (dirPath: string): Promise<FileEntry[]> => {
    try {
      const entries = await readDir(dirPath);
      const fileEntries: FileEntry[] = entries
        .map((entry) => ({
          name: entry.name,
          path: `${dirPath}/${entry.name}`,
          isDirectory: entry.isDirectory,
        }))
        .sort((a, b) => {
          // Directories first, then alphabetically
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
      return fileEntries;
    } catch (err) {
      console.error("Failed to read directory:", err);
      return [];
    }
  }, []);

  const handleOpenFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (!selected) return;

    setRootPath(selected as string);
    const entries = await loadDirectory(selected as string);
    setRootEntries(entries);
  };

  const folderName = rootPath ? rootPath.split("/").pop() : null;

  return (
    <div
      className={`flex flex-col bg-gray-50 dark:bg-[#252526] border-r border-gray-200 dark:border-gray-700 shrink-0 transition-all duration-200 ${isCollapsed ? "w-10" : "w-60"
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
        {!isCollapsed && (
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
            {folderName || "Explorer"}
          </span>
        )}
        <div className="flex gap-1">
          {!isCollapsed && (
            <button
              className="p-1 hover:bg-gray-200 dark:hover:bg-[#3c3c3c] rounded transition-colors"
              onClick={handleOpenFolder}
              title="Open Folder"
            >
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </button>
          )}
          <button
            className="p-1 hover:bg-gray-200 dark:hover:bg-[#3c3c3c] rounded transition-colors"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <svg
              className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* File Tree Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
          {rootPath ? (
            rootEntries.length > 0 ? (
              rootEntries.map((entry) => (
                <TreeNode
                  key={entry.path}
                  entry={entry}
                  depth={0}
                  onFileSelect={onFileSelect}
                  currentFile={currentFile}
                  onLoadChildren={loadDirectory}
                />
              ))
            ) : (
              <div className="text-xs text-gray-400 dark:text-gray-500 italic px-3 py-2">
                Empty folder
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                No folder opened
              </p>
              <button
                className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                onClick={handleOpenFolder}
              >
                Open Folder
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileTree;
