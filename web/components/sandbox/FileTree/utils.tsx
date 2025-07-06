import { cn } from "@/lib/utils";
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

export const getFileIcon = (fileName: string) => {
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

export const getFolderIcon = (folderName: string, isExpanded: boolean) => {
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
