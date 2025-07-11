"use client";

// hooks
import { useRunnerSocket } from "@/hooks/useSocket";

// React
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Components
import Sandbox from "@/components/sandbox/index";
import { Button } from "@/components/ui/button";
import { FileTreeAction, Tree } from "@/components/sandbox/FileTree";
import { toast } from "sonner";
import { TerminalRef } from "@/components/sandbox/Terminal";

export default function ReplPage() {
  const { slug } = useParams();

  // sockets states
  const { isConnected, emit, on, off } = useRunnerSocket(slug as string);
  const [isLoading, setIsLoading] = useState(false);

  // sandbox states
  const [tree, setTree] = useState<Tree | null>(null);
  const [code, setCode] = useState<string>(
    `// Welcome to Devex: your Cloud IDE Editor`,
  );
  const [fileType, setFileType] = useState<string>("js");
  const [filePath, setFilePath] = useState<string>("");

  const terminalRef = useRef<TerminalRef>(null);
  const terminalSessionIdRef = useRef<string | null>(null);
  const [terminalConnectionStatus, setTerminalConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [terminalError, setTerminalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;
    console.log("Use Effect call");

    emit("Connection");

    // Connection and loading handlers
    on("Loaded", (data) => {
      console.log("Received Loaded Data", data);
      setTree({
        "": data.rootContents,
      });
      setIsLoading(false);
      toast.success("Workspace loaded successfully");
    });

    on("error", (data) => {
      console.error("WebSocket error:", data);
      toast.error(data.message || "An error occurred");
      setIsLoading(false);
    });

    // File tree response handlers
    on("fetchDirResponse", (data) => {
      console.log("📁 Dir contents:", data);
      if (data.error) {
        toast.error(`Failed to load directory: ${data.error}`);
      } else {
        setTree((prev) => ({ ...prev, [data.path]: data.contents }));
      }
    });

    on("fetchContentResponse", (data) => {
      console.log("📄 File contents:", data);
      if (data.error) {
        toast.error(`Failed to load file: ${data.error}`);
      } else {
        setCode(data.content);
        setFilePath(data.path);
        setFileType(data.path.split(".").pop()?.toLowerCase() || "txt");
        toast.success(`File loaded: ${data.path}`);
      }
    });

    on("updateContentResponse", (data) => {
      console.log("💾 File update response:", data);
      if (data.error) {
        toast.error(`Failed to save file: ${data.error}`);
      } else {
        // toast.success("File saved successfully");
      }
    });

    // File operation response handlers
    on("createFileResponse", (data) => {
      console.log("📄 Create file response:", data);
      if (data.error) {
        toast.error(`Failed to create file: ${data.error}`);
      } else {
        toast.success(`File created: ${data.path}`);
        // Refresh the parent directory
        const parentPath = data.path.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: parentPath });
      }
    });

    on("createFolderResponse", (data) => {
      console.log("📁 Create folder response:", data);
      if (data.error) {
        toast.error(`Failed to create folder: ${data.error}`);
      } else {
        toast.success(`Folder created: ${data.path}`);
        // Refresh the parent directory
        const parentPath = data.path.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: parentPath });
      }
    });

    on("deleteResponse", (data) => {
      console.log("🗑️ Delete response:", data);
      if (data.error) {
        toast.error(`Failed to delete: ${data.error}`);
      } else {
        toast.success(`Deleted: ${data.path}`);
        // Refresh the parent directory
        const parentPath = data.path.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: parentPath });
      }
    });

    on("renameResponse", (data) => {
      console.log("✏️ Rename response:", data);
      if (data.error) {
        toast.error(`Failed to rename: ${data.error}`);
      } else {
        toast.success(`Renamed: ${data.oldPath} → ${data.newPath}`);
        // Refresh the parent directory
        const parentPath = data.newPath.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: parentPath });
      }
    });

    on("copyResponse", (data) => {
      console.log("📋 Copy response:", data);
      if (data.error) {
        toast.error(`Failed to copy: ${data.error}`);
      } else {
        toast.success(`Copied: ${data.sourcePath} → ${data.targetPath}`);
        // Refresh the target directory
        const targetDir = data.targetPath.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: targetDir });
      }
    });

    on("cutResponse", (data) => {
      console.log("✂️ Cut response:", data);
      if (data.error) {
        toast.error(`Failed to cut: ${data.error}`);
      } else {
        toast.success(`Cut: ${data.sourcePath}`);
        // Refresh the source directory
        const sourceDir = data.sourcePath.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: sourceDir });
      }
    });

    on("pasteResponse", (data) => {
      console.log("📋 Paste response:", data);
      if (data.error) {
        toast.error(`Failed to paste: ${data.error}`);
      } else {
        toast.success(`Pasted to: ${data.targetPath}`);
        // Refresh the target directory
        const targetDir = data.targetPath.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: targetDir });
      }
    });

    // Terminal response handlers
    on("terminalResponse", (data) => {
      if (terminalRef.current?.isReady()) {
        terminalRef.current.writeData(data);
      }
      console.log("🖥️ Terminal output:", data);
    });

    on("terminalConnected", (data) => {
      terminalSessionIdRef.current = data.sessionId || "";
      setTerminalConnectionStatus("connected");
      setTerminalError(null);
      terminalRef.current?.writeData(
        "\r\n\x1b[32m✓ Terminal connected successfully\x1b[0m\r\n",
      );
      toast.success("Terminal connected");
      console.log("🖥️ Terminal Connected:", data);
    });

    on("terminalClosed", (data) => {
      setTerminalConnectionStatus("disconnected");
      terminalRef.current?.writeData(
        "\r\n\x1b[31m✗ Terminal session closed\x1b[0m\r\n",
      );
      toast.info("Terminal session closed");
      console.log("🖥️ Terminal Closed:", data);
    });

    on("terminalError", (data) => {
      setTerminalError(data.error || "Unknown terminal error");
      setTerminalConnectionStatus("disconnected");
      terminalRef.current?.writeData(
        `\r\n\x1b[31m✗ Terminal error: ${data.error}\x1b[0m\r\n`,
      );
      toast.error(`Terminal error: ${data.error}`);
      console.error("🖥️ Terminal Error:", data);
    });

    return () => {
      off("Loaded");
      off("error");
      off("fetchDirResponse");
      off("fetchContentResponse");
      off("updateContentResponse");
      off("createFileResponse");
      off("createFolderResponse");
      off("deleteResponse");
      off("renameResponse");
      off("copyResponse");
      off("cutResponse");
      off("pasteResponse");
      off("terminalResponse");
      off("terminalConnected");
      off("terminalClosed");
      off("terminalError");
    };
  }, [isConnected]);

  // Editor Helpers
  const fetchDir = async (path: string) => {
    setIsLoading(true);
    emit("fetchDir", { Dir: path });
  };

  const fetchContent = async (path: string) => {
    setIsLoading(true);
    emit("fetchContent", { path });
  };

  const updateContent = async (patch: string) => {
    setIsLoading(true);
    emit("updateContent", { path: filePath, patch });
  };

  const handleFileTreeAction = (action: FileTreeAction) => {
    setIsLoading(true);
    switch (action.type) {
      case "create-file":
        emit("createFile", {
          path: `${action.path}/${action.newName}`,
        });
        break;

      case "create-folder":
        emit("createFolder", {
          path: `${action.path}/${action.newName}`,
        });
        break;

      case "rename":
        emit("rename", {
          oldPath: action.path,
          newPath: `${action.path.split("/").slice(0, -1).join("/")}/${action.newName}`,
        });
        break;

      case "delete":
        emit("delete", {
          path: action.path,
        });
        break;

      case "copy":
        emit("copy", {
          sourcePath: action.path,
          targetPath: action.targetPath,
        });
        break;

      case "cut":
        emit("cut", {
          sourcePath: action.path,
        });
        break;

      case "paste":
        emit("paste", {
          targetPath: action.targetPath,
        });
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
        setIsLoading(false);
        break;
    }
  };

  // Enhanced Terminal Helpers
  const handleTerminalSendData = (data: string) => {
    emit("terminalInput", {
      data,
      sessionId: terminalSessionIdRef.current,
    });
  };

  const handleRequestTerminal = useCallback(() => {
    setTerminalConnectionStatus("connecting");
    setTerminalError(null);
    emit("requestTerminal", { sessionId: terminalSessionIdRef.current });
  }, [emit, terminalSessionIdRef.current]);

  const handleTerminalResize = useCallback(
    (cols: number, rows: number) => {
      emit("terminalResize", {
        cols,
        rows,
        sessionId: terminalSessionIdRef.current,
      });
    },
    [emit, terminalSessionIdRef.current],
  );

  // Enhanced terminal event handlers
  const handleTerminalReady = useCallback(() => {
    setTerminalConnectionStatus("connected");
    setTerminalError(null);
    console.log("🖥️ Terminal ready");
  }, []);

  const handleTerminalClose = useCallback(() => {
    emit("closeTerminal", {
      sessionId: terminalSessionIdRef.current,
    });
    setTerminalConnectionStatus("disconnected");
    console.log("🖥️ Terminal closed by user");
  }, []);

  const handleTerminalError = useCallback((error: string) => {
    setTerminalError(error);
    setTerminalConnectionStatus("disconnected");
    console.error("🖥️ Terminal error:", error);
  }, []);

  // Search functionality for terminal
  // Show loading state
  if (!tree) {
    return (
      <div className="h-screen w-full bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm sm:text-base">Loading Sandbox...</p>
          {!isConnected && (
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Connecting to server...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Sandbox
      isConnected={isConnected}
      editor={{ updateContent, code, setCode, fileType }}
      fileTree={{
        tree,
        fetchDir,
        fetchContent,
        handleFileTreeAction,
        filePath,
      }}
      terminal={{
        ref: terminalRef,
        handleRequest: handleRequestTerminal,
        handleClose: handleTerminalClose,
        handleError: handleTerminalError,
        handleResize: handleTerminalResize,
        handleReady: handleTerminalReady,
        handleSendData: handleTerminalSendData,
        sessionId: terminalSessionIdRef.current,
        status: terminalConnectionStatus,
        error: terminalError,
      }}
      replId={slug as string}
    />
  );
}
