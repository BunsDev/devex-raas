import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { File, Folder, Tree } from "@/components/magicui/file-tree";
import {
  Copy,
  Edit3,
  FilePlus,
  FolderPlus,
  Plus,
  Scissors,
  Trash,
} from "lucide-react";

const FileContextMenu = ({
  path,
  isDir,
  children,
  handleCreateFile,
  handleCreateFolder,
  handleCut,
  handleCopy,
  handleRename,
  handleDelete,
  handlePaste,
  clipboard,
}: {
  path: string;
  isDir: boolean;
  children: React.ReactNode;
  handleCreateFile: (path: string) => void;
  handleCreateFolder: (path: string) => void;
  handleRename: (path: string, currentName: string) => void;
  handleCopy: (path: string) => void;
  handleCut: (path: string) => void;
  handleDelete: (path: string) => void;
  handlePaste: (targetPath: string) => void;
  clipboard: {
    path: string;
    type: "copy" | "cut";
  } | null;
}) => (
  <ContextMenu>
    <ContextMenuTrigger>{children}</ContextMenuTrigger>
    <ContextMenuContent className="w-52 bg-gray-800 border-gray-700 text-gray-100">
      {isDir && (
        <>
          <ContextMenuItem
            onClick={() => handleCreateFile(path)}
            className="hover:bg-gray-700 focus:bg-gray-700"
          >
            <FilePlus className="w-4 h-4 mr-2 text-green-400" />
            New File
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleCreateFolder(path)}
            className="hover:bg-gray-700 focus:bg-gray-700"
          >
            <FolderPlus className="w-4 h-4 mr-2 text-blue-400" />
            New Folder
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-gray-700" />
        </>
      )}
      <ContextMenuItem
        onClick={() => handleRename(path, path.split("/").pop() || "")}
        className="hover:bg-gray-700 focus:bg-gray-700"
      >
        <Edit3 className="w-4 h-4 mr-2 text-orange-400" />
        Rename
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => handleDelete(path)}
        className="hover:bg-gray-700 focus:bg-gray-700 text-red-400"
      >
        <Trash className="w-4 h-4 mr-2" />
        Delete
      </ContextMenuItem>
      <ContextMenuSeparator className="bg-gray-700" />
      <ContextMenuItem
        onClick={() => handleCopy(path)}
        className="hover:bg-gray-700 focus:bg-gray-700"
      >
        <Copy className="w-4 h-4 mr-2 text-blue-400" />
        Copy
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => handleCut(path)}
        className="hover:bg-gray-700 focus:bg-gray-700"
      >
        <Scissors className="w-4 h-4 mr-2 text-yellow-400" />
        Cut
      </ContextMenuItem>
      {clipboard && isDir && (
        <ContextMenuItem
          onClick={() => handlePaste(path)}
          className="hover:bg-gray-700 focus:bg-gray-700"
        >
          <Plus className="w-4 h-4 mr-2 text-green-400" />
          Paste
        </ContextMenuItem>
      )}
    </ContextMenuContent>
  </ContextMenu>
);

export default FileContextMenu;
