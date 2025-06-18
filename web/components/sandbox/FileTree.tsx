"use client";
import { useState } from "react";
import { File, Folder, Tree } from "@/components/magicui/file-tree";
import { cn } from "@/lib/utils";

export type DirEntry = {
  name: string;
  isDir: boolean;
};

export type Tree = {
  [path: string]: DirEntry[];
};

type Props = {
  tree: Tree;
  fetchDir: (path: string) => Promise<void>;
  fetchContent: (filePath: string) => Promise<void>;
};

export default function FileTree({ tree, fetchDir, fetchContent }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);

  const handleToggleFolder = async (path: string) => {
    if (expanded.has(path)) {
      // Collapse folder
      const updated = new Set(expanded);
      updated.delete(path);
      setExpanded(updated);
    } else {
      // Expand and fetch if not already fetched
      if (!tree[path]) {
        await fetchDir(path);
      }
      const updated = new Set(expanded);
      updated.add(path);
      setExpanded(updated);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
        return "🟨";
      case "ts":
      case "tsx":
        return "🔷";
      case "css":
        return "🎨";
      case "html":
        return "🌐";
      case "json":
        return "📋";
      case "md":
        return "📝";
      case "py":
        return "🐍";
      case "java":
        return "☕";
      case "cpp":
      case "c":
        return "⚡";
      case "go":
        return "🐹";
      case "rust":
        return "🦀";
      case "vue":
        return "💚";
      case "php":
        return "🐘";
      default:
        return "📄";
    }
  };

  const getFolderIcon = (isExpanded: boolean) => {
    return isExpanded ? "📂" : "📁";
  };

  const renderTree = (entries: DirEntry[], currentPath = "", depth = 0) => {
    return entries.map((entry) => {
      const entryPath = currentPath
        ? `${currentPath}/${entry.name}`
        : entry.name;

      const isHovered = hoveredPath === entryPath;
      const isActive = activePath === entryPath;

      if (entry.isDir) {
        const isExpanded = expanded.has(entryPath);
        return (
          <div key={entryPath} className="group">
            <Folder
              element={JSON.stringify(
                <div
                  className={cn(
                    "flex backdrop-blur-lg  items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 ease-in-out border border-transparent hover:border-emerald-500/30",
                    isHovered
                      ? "bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/10"
                      : "text-gray-300 hover:text-emerald-200",
                    isActive ? "bg-emerald-600/30 text-emerald-200" : "",
                  )}
                  onMouseEnter={() => setHoveredPath(entryPath)}
                  onMouseLeave={() => setHoveredPath(null)}
                  style={{ marginLeft: `${depth * 16}px` }}
                >
                  <span className="text-sm transition-transform duration-200 group-hover:scale-110">
                    {getFolderIcon(isExpanded)}
                  </span>
                  <span className="font-medium text-sm tracking-wide">
                    {entry.name}
                  </span>
                  <div
                    className={`
                                  ml-auto w-1 h-1 rounded-full transition-all duration-300
                                  ${isExpanded ? "bg-emerald-400 shadow-lg shadow-emerald-400/50" : "bg-gray-600"}
                                `}
                  />
                </div>,
              )}
              value={entryPath}
              onClick={() => {
                setActivePath(entryPath);
                handleToggleFolder(entryPath);
              }}
            >
              {expanded.has(entryPath) && tree[entryPath] && (
                <div className="ml-2 border-l border-gray-700/50 pl-2 mt-1">
                  {renderTree(tree[entryPath], entryPath, depth + 1)}
                </div>
              )}
            </Folder>
          </div>
        );
      } else {
        return (
          <div key={entryPath} className="group">
            <File
              value={entryPath}
              onClick={async () => {
                setActivePath(entryPath);
                await fetchContent(entryPath);
              }}
            >
              <div
                className={`
                  flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer
                  transition-all duration-200 ease-in-out
                  ${
                    isHovered
                      ? "bg-gray-700/50 text-gray-100 shadow-lg shadow-gray-700/20"
                      : "text-gray-400 hover:text-gray-200"
                  }
                  ${isActive ? "bg-gray-600/40 text-gray-100 border-emerald-500/40" : ""}
                  border border-transparent hover:border-gray-600/50
                  backdrop-blur-sm
                `}
                onMouseEnter={() => setHoveredPath(entryPath)}
                onMouseLeave={() => setHoveredPath(null)}
                style={{ marginLeft: `${depth * 16}px` }}
              >
                <span className="text-xs transition-transform duration-200 group-hover:scale-110">
                  {getFileIcon(entry.name)}
                </span>
                <span className="text-sm font-normal tracking-wide truncate">
                  {entry.name}
                </span>
                <div
                  className={`
                  ml-auto w-1 h-1 rounded-full transition-all duration-300
                  ${isActive ? "bg-emerald-400 shadow-lg shadow-emerald-400/50" : "bg-transparent"}
                `}
                />
              </div>
            </File>
          </div>
        );
      }
    });
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-auto">
      {/* Header with gradient */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-emerald-500/20 backdrop-blur-sm">
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold text-emerald-400 tracking-wider uppercase">
            File Explorer
          </h2>
          <div className="mt-1 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent rounded-full" />
        </div>
      </div>

      {/* Main tree container */}
      <div className="flex-1 bg-gradient-to-b from-gray-900 via-black to-gray-900 relative">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.3)_1px,_transparent_0)] bg-[length:20px_20px]" />

        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-400/5 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        <Tree className="relative z-10 overflow-hidden bg-transparent p-4 space-y-1">
          {tree[""] && renderTree(tree[""], "")}
        </Tree>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
}
