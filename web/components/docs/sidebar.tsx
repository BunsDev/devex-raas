// components/docs/DocsSidebar.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  Search,
  FolderOpen,
  File,
} from "lucide-react";
import { DocTree, DocFile } from "@/lib/docs/github";

interface DocsSidebarProps {
  docTree: DocTree;
  currentPath: string;
  onNavigate: (path: string) => void;
}

const DocsSidebar: React.FC<DocsSidebarProps> = ({
  docTree,
  currentPath,
  onNavigate,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<DocFile[]>([]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const searchFiles = (tree: DocTree, term: string): DocFile[] => {
    const results: DocFile[] = [];

    const traverse = (node: DocTree) => {
      Object.entries(node).forEach(([key, value]) => {
        if (
          value.type === "file" &&
          value.name.toLowerCase().includes(term.toLowerCase())
        ) {
          results.push(value);
        } else if (value.children) {
          traverse(value.children as DocTree);
        }
      });
    };

    traverse(tree);
    return results;
  };

  useEffect(() => {
    if (searchTerm) {
      const results = searchFiles(docTree, searchTerm);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, docTree]);

  const renderTreeNode = (node: DocTree, depth: number = 0) => {
    return Object.entries(node).map(([key, value]) => {
      const isExpanded = expandedFolders.has(value.path);
      const isActive = currentPath === value.path;

      return (
        <div key={value.path} className="select-none">
          <div
            className={`flex items-center py-3 px-3 cursor-pointer rounded-lg transition-all duration-200 group relative
              ${depth > 0 ? "ml-4" : ""}
              ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-400 border-l-4 border-emerald-500 font-semibold"
                  : "text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100"
              }`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
            onClick={() => {
              if (value.type === "file") {
                onNavigate(value.path);
              } else {
                toggleFolder(value.path);
              }
            }}
          >
            {value.type === "dir" ? (
              <>
                <div className="flex items-center justify-center w-5 h-5 mr-3">
                  {isExpanded ? (
                    <ChevronDown
                      size={16}
                      className="text-zinc-400 group-hover:text-emerald-400 transition-colors"
                    />
                  ) : (
                    <ChevronRight
                      size={16}
                      className="text-zinc-400 group-hover:text-emerald-400 transition-colors"
                    />
                  )}
                </div>
                <div className="flex items-center justify-center w-5 h-5 mr-3">
                  {isExpanded ? (
                    <FolderOpen size={16} className="text-emerald-400" />
                  ) : (
                    <Folder
                      size={16}
                      className="text-zinc-400 group-hover:text-emerald-400 transition-colors"
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-5 h-5 mr-3"></div>
                <div className="flex items-center justify-center w-5 h-5 mr-3">
                  <File
                    size={16}
                    className={`${
                      isActive
                        ? "text-emerald-400"
                        : "text-zinc-400 group-hover:text-emerald-400"
                    } transition-colors`}
                  />
                </div>
              </>
            )}

            <span className="truncate text-sm font-medium tracking-wide">
              {value.name === "README.md"
                ? "Overview"
                : value.name.replace(".md", "")}
            </span>

            {/* Active indicator */}
            {isActive && (
              <div className="absolute right-2 w-2 h-2 bg-emerald-400 rounded-full"></div>
            )}
          </div>

          {value.type === "dir" && isExpanded && value.children && (
            <div className="mt-1">
              {renderTreeNode(value.children as DocTree, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-80 bg-zinc-900 border-r border-zinc-800 h-full flex flex-col shadow-2xl">
      {/* Search Header */}
      <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg
                     text-zinc-100 placeholder-zinc-400 text-sm font-medium
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                     transition-all duration-200 hover:border-zinc-600"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
        {searchTerm ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-zinc-400 font-medium">
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""}
              </div>
              <div className="h-px bg-zinc-700 flex-1 ml-4"></div>
            </div>

            <div className="flex flex-col gap-2">
              {searchResults.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center p-3 cursor-pointer hover:bg-zinc-800/50
                           rounded-lg transition-all duration-200 group border border-transparent
                           hover:border-zinc-700"
                  onClick={() => {
                    onNavigate(file.path);
                    setSearchTerm("");
                    setSearchResults([]);
                  }}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 bg-zinc-800 rounded-lg mr-3
                                group-hover:bg-emerald-500/20 transition-colors"
                  >
                    <FileText
                      size={16}
                      className="text-zinc-400 group-hover:text-emerald-400 transition-colors"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-zinc-100 truncate text-sm">
                      {file.name === "README.md"
                        ? "Overview"
                        : file.name.replace(".md", "")}
                    </div>
                    <div className="text-xs text-zinc-500 truncate font-mono mt-1">
                      {file.path}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-1">
            {Object.keys(docTree).length > 0 ? (
              renderTreeNode(docTree)
            ) : (
              <div className="text-center py-8">
                <Folder className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">No documentation found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-center">
          <div className="text-xs text-zinc-500 font-medium">
            Documentation Explorer
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsSidebar;
