"use client";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  FolderIcon,
  FolderOpen,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Scissors,
  FileIcon,
  FolderPlus,
  FilePlus,
  MoreHorizontal,
  Search,
  X,
  RefreshCw,
} from "lucide-react";
import FileContextMenu from "./ContextMenu";

export type DirEntry = {
  name: string;
  isDir: boolean;
};

export type Tree = {
  [path: string]: DirEntry[];
};

export type FileTreeAction = {
  type:
    | "create-file"
    | "create-folder"
    | "delete"
    | "rename"
    | "copy"
    | "cut"
    | "paste";
  path: string;
  newName?: string;
  targetPath?: string;
};

type Props = {
  tree: Tree;
  fetchDir: (path: string) => Promise<void>;
  fetchContent: (filePath: string) => Promise<void>;
  onAction?: (action: FileTreeAction) => void;
  projectName?: string;
};

export default function VSCodeFileTree({
  tree,
  fetchDir,
  fetchContent,
  onAction,
  projectName = "Project",
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([""]));
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [contextMenuPath, setContextMenuPath] = useState<string | null>(null);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [dialogState, setDialogState] = useState<{
    type: "create-file" | "create-folder" | "rename" | null;
    path: string;
    currentName?: string;
  }>({ type: null, path: "" });
  const [inputValue, setInputValue] = useState("");
  const [clipboard, setClipboard] = useState<{
    path: string;
    type: "copy" | "cut";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleFolder = async (path: string) => {
    if (expanded.has(path)) {
      const updated = new Set(expanded);
      updated.delete(path);
      setExpanded(updated);
    } else {
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
    const iconClass = "w-4 h-4 flex-shrink-0";

    // Special files
    if (fileName.toLowerCase() === "package.json") {
      return <FileText className={cn(iconClass, "text-green-500")} />;
    }
    if (fileName.toLowerCase() === "readme.md") {
      return <FileText className={cn(iconClass, "text-blue-400")} />;
    }
    if (fileName.toLowerCase() === "dockerfile") {
      return <FileText className={cn(iconClass, "text-blue-600")} />;
    }

    switch (ext) {
      case "js":
      case "jsx":
        return <FileText className={cn(iconClass, "text-yellow-500")} />;
      case "ts":
      case "tsx":
        return <FileText className={cn(iconClass, "text-blue-500")} />;
      case "css":
      case "scss":
      case "sass":
        return <FileText className={cn(iconClass, "text-pink-500")} />;
      case "html":
      case "htm":
        return <FileText className={cn(iconClass, "text-orange-500")} />;
      case "json":
        return <FileText className={cn(iconClass, "text-green-500")} />;
      case "md":
      case "mdx":
        return <FileText className={cn(iconClass, "text-blue-400")} />;
      case "py":
        return <FileText className={cn(iconClass, "text-green-600")} />;
      case "java":
        return <FileText className={cn(iconClass, "text-red-500")} />;
      case "cpp":
      case "c":
      case "h":
        return <FileText className={cn(iconClass, "text-purple-500")} />;
      case "go":
        return <FileText className={cn(iconClass, "text-cyan-500")} />;
      case "rs":
        return <FileText className={cn(iconClass, "text-orange-600")} />;
      case "vue":
        return <FileText className={cn(iconClass, "text-green-400")} />;
      case "php":
        return <FileText className={cn(iconClass, "text-indigo-500")} />;
      case "xml":
        return <FileText className={cn(iconClass, "text-orange-400")} />;
      case "yml":
      case "yaml":
        return <FileText className={cn(iconClass, "text-purple-400")} />;
      case "toml":
        return <FileText className={cn(iconClass, "text-gray-500")} />;
      case "env":
        return <FileText className={cn(iconClass, "text-yellow-600")} />;
      case "sh":
      case "bash":
        return <FileText className={cn(iconClass, "text-green-400")} />;
      case "sql":
        return <FileText className={cn(iconClass, "text-blue-600")} />;
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "svg":
      case "webp":
        return <FileIcon className={cn(iconClass, "text-pink-400")} />;
      case "pdf":
        return <FileIcon className={cn(iconClass, "text-red-400")} />;
      case "zip":
      case "rar":
      case "tar":
      case "gz":
        return <FileIcon className={cn(iconClass, "text-yellow-400")} />;
      default:
        return <FileText className={cn(iconClass, "text-gray-400")} />;
    }
  };

  const getFolderIcon = (folderName: string, isExpanded: boolean) => {
    const iconClass = "w-4 h-4 flex-shrink-0";

    // Special folders
    switch (folderName.toLowerCase()) {
      case "node_modules":
        return isExpanded ? (
          <FolderOpen className={cn(iconClass, "text-green-600")} />
        ) : (
          <FolderIcon className={cn(iconClass, "text-green-600")} />
        );
      case "src":
      case "source":
        return isExpanded ? (
          <FolderOpen className={cn(iconClass, "text-blue-500")} />
        ) : (
          <FolderIcon className={cn(iconClass, "text-blue-500")} />
        );
      case "public":
      case "assets":
        return isExpanded ? (
          <FolderOpen className={cn(iconClass, "text-purple-500")} />
        ) : (
          <FolderIcon className={cn(iconClass, "text-purple-500")} />
        );
      case "components":
        return isExpanded ? (
          <FolderOpen className={cn(iconClass, "text-cyan-500")} />
        ) : (
          <FolderIcon className={cn(iconClass, "text-cyan-500")} />
        );
      case "pages":
      case "views":
        return isExpanded ? (
          <FolderOpen className={cn(iconClass, "text-green-500")} />
        ) : (
          <FolderIcon className={cn(iconClass, "text-green-500")} />
        );
      case "utils":
      case "lib":
      case "helpers":
        return isExpanded ? (
          <FolderOpen className={cn(iconClass, "text-orange-500")} />
        ) : (
          <FolderIcon className={cn(iconClass, "text-orange-500")} />
        );
      case "styles":
      case "css":
        return isExpanded ? (
          <FolderOpen className={cn(iconClass, "text-pink-500")} />
        ) : (
          <FolderIcon className={cn(iconClass, "text-pink-500")} />
        );
      case "tests":
      case "test":
      case "__tests__":
        return isExpanded ? (
          <FolderOpen className={cn(iconClass, "text-red-500")} />
        ) : (
          <FolderIcon className={cn(iconClass, "text-red-500")} />
        );
      case ".git":
        return isExpanded ? (
          <FolderOpen className={cn(iconClass, "text-orange-600")} />
        ) : (
          <FolderIcon className={cn(iconClass, "text-orange-600")} />
        );
      default:
        return isExpanded ? (
          <FolderOpen className={cn(iconClass, "text-blue-400")} />
        ) : (
          <FolderIcon className={cn(iconClass, "text-blue-400")} />
        );
    }
  };

  const handleCreateFile = (path: string) => {
    setDialogState({ type: "create-file", path });
    setInputValue("");
  };

  const handleCreateFolder = (path: string) => {
    setDialogState({ type: "create-folder", path });
    setInputValue("");
  };

  const handleRename = (path: string, currentName: string) => {
    setDialogState({ type: "rename", path, currentName });
    setInputValue(currentName);
  };

  const handleDelete = (path: string) => {
    const itemName = path.split("/").pop() || path;
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
      onAction?.({ type: "delete", path });
    }
  };

  const handleCopy = (path: string) => {
    setClipboard({ path, type: "copy" });
  };

  const handleCut = (path: string) => {
    setClipboard({ path, type: "cut" });
  };

  const handlePaste = (targetPath: string) => {
    if (clipboard) {
      onAction?.({
        type: "paste",
        path: clipboard.path,
        targetPath,
      });
      if (clipboard.type === "cut") {
        setClipboard(null);
      }
    }
  };

  const handleDialogSubmit = () => {
    if (!dialogState.type || !inputValue.trim()) return;

    switch (dialogState.type) {
      case "create-file":
        onAction?.({
          type: "create-file",
          path: dialogState.path,
          newName: inputValue,
        });
        break;
      case "create-folder":
        onAction?.({
          type: "create-folder",
          path: dialogState.path,
          newName: inputValue,
        });
        break;
      case "rename":
        onAction?.({
          type: "rename",
          path: dialogState.path,
          newName: inputValue,
        });
        break;
    }

    setDialogState({ type: null, path: "" });
    setInputValue("");
  };

  const filterEntries = (entries: DirEntry[], query: string) => {
    if (!query) return entries;
    return entries.filter((entry) =>
      entry.name.toLowerCase().includes(query.toLowerCase()),
    );
  };

  const renderTree = (entries: DirEntry[], currentPath = "", depth = 0) => {
    const filteredEntries = filterEntries(entries, searchQuery);

    return filteredEntries.map((entry) => {
      const entryPath = currentPath
        ? `${currentPath}/${entry.name}`
        : entry.name;
      const isHovered = hoveredPath === entryPath;
      const isActive = activePath === entryPath;
      const isExpanded = expanded.has(entryPath);
      const isCut = clipboard?.type === "cut" && clipboard.path === entryPath;

      if (entry.isDir) {
        return (
          <div key={entryPath} className="select-none">
            <FileContextMenu
              path={entryPath}
              isDir={true}
              handleCreateFile={handleCreateFile}
              handleCreateFolder={handleCreateFolder}
              handleRename={handleRename}
              handleCopy={handleCopy}
              handleDelete={handleDelete}
              handleCut={handleCut}
              handlePaste={handlePaste}
              clipboard={clipboard}
            >
              <div
                className={cn(
                  "flex items-center gap-1 px-1 py-0.5 text-sm cursor-pointer transition-colors group relative",
                  "hover:bg-gray-700/50",
                  isActive && "bg-gray-700/70",
                  isCut && "opacity-50",
                )}
                onMouseEnter={() => setHoveredPath(entryPath)}
                onMouseLeave={() => setHoveredPath(null)}
                onClick={() => {
                  setActivePath(entryPath);
                  handleToggleFolder(entryPath);
                }}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  )}
                  {getFolderIcon(entry.name, isExpanded)}
                  <span className="truncate text-gray-200 text-xs font-medium">
                    {entry.name}
                  </span>
                </div>
              </div>
            </FileContextMenu>
            {isExpanded && tree[entryPath] && (
              <div>{renderTree(tree[entryPath], entryPath, depth + 1)}</div>
            )}
          </div>
        );
      } else {
        return (
          <div key={entryPath} className="select-none">
            <FileContextMenu
              path={entryPath}
              isDir={false}
              handleCreateFile={handleCreateFile}
              handleCreateFolder={handleCreateFolder}
              handleRename={handleRename}
              handleCopy={handleCopy}
              handleDelete={handleDelete}
              handleCut={handleCut}
              handlePaste={handlePaste}
              clipboard={clipboard}
            >
              <div
                className={cn(
                  "flex items-center gap-2 px-1 py-0.5 text-sm cursor-pointer transition-colors group relative",
                  "hover:bg-gray-700/50",
                  isActive && "bg-gray-700/70",
                  isCut && "opacity-50",
                )}
                onMouseEnter={() => setHoveredPath(entryPath)}
                onMouseLeave={() => setHoveredPath(null)}
                onClick={async () => {
                  setActivePath(entryPath);
                  await fetchContent(entryPath);
                }}
                style={{ paddingLeft: `${depth * 12 + 20}px` }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(entry.name)}
                  <span className="truncate text-gray-300 text-xs">
                    {entry.name}
                  </span>
                </div>
              </div>
            </FileContextMenu>
          </div>
        );
      }
    });
  };

  return (
    <div className="flex h-full w-full flex-col bg-gray-900 text-gray-100 border-r border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="text-xs font-semibold text-gray-200 uppercase tracking-wide truncate">
            {projectName}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCreateFile("")}
            className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-gray-200"
            title="New File"
          >
            <FilePlus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCreateFolder("")}
            className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-gray-200"
            title="New Folder"
          >
            <FolderPlus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-gray-200"
            title="Search"
          >
            <Search className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchDir("")}
            className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-gray-200"
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-gray-700 bg-gray-800/30">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-7 h-6 text-xs bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-400 focus:border-blue-500"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0 hover:bg-gray-700 text-gray-400"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-auto">
        <div className="py-1">{tree[""] && renderTree(tree[""], "")}</div>
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1 border-t border-gray-700 bg-gray-800/30">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {Object.keys(tree).length} folders
          </span>
          {clipboard && (
            <span className="text-xs text-blue-400">
              {clipboard.type === "copy" ? "Copied" : "Cut"}:{" "}
              {clipboard.path.split("/").pop()}
            </span>
          )}
        </div>
      </div>

      {/* Dialog for creating/renaming */}
      <Dialog
        open={!!dialogState.type}
        onOpenChange={() => setDialogState({ type: null, path: "" })}
      >
        <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-100">
              {dialogState.type === "create-file" && "Create New File"}
              {dialogState.type === "create-folder" && "Create New Folder"}
              {dialogState.type === "rename" && "Rename"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-gray-200">
                {dialogState.type === "rename" ? "New name" : "Name"}
              </Label>
              <Input
                id="name"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleDialogSubmit();
                  }
                }}
                placeholder={
                  dialogState.type === "create-file"
                    ? "filename.ext"
                    : dialogState.type === "create-folder"
                      ? "folder-name"
                      : "new-name"
                }
                className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500"
                autoFocus
              />
            </div>
            {dialogState.path && (
              <div className="text-xs text-gray-400">
                Location: {dialogState.path || "Root"}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogState({ type: null, path: "" })}
              className="border-gray-600 text-gray-200 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDialogSubmit}
              disabled={!inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {dialogState.type === "rename" ? "Rename" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
