import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Search,
  Maximize2,
  Minimize2,
  PanelLeftOpen,
  PanelLeftClose,
  Play,
  TerminalIcon,
  X,
  Menu,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import Editor from "./Editor";
import FileTree, { FileTreeAction, Tree } from "./FileTree";
import Output from "./Output";
import Terminal, { TerminalRef } from "./Terminal";
import { useRunnerSocket } from "@/hooks/useSocket";

interface SandboxProps {
  slug: string;
}

const Sandbox: React.FC<SandboxProps> = ({ slug }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [outputVisible, setOutputVisible] = useState(true);
  const [activeBottomPanel, setActiveBottomPanel] = useState<
    "terminal" | "output"
  >("terminal");
  const [tree, setTree] = useState<Tree | null>(null);
  const [code, setCode] = useState<string>(
    `// Welcome to Devex: your Cloud IDE Editor`,
  );
  const [fileType, setFileType] = useState<string>("js");
  const [filePath, setFilePath] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);

  // Terminal-specific state
  const terminalSessionIdRef = useRef<string>("");
  const [terminalConnectionStatus, setTerminalConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [terminalError, setTerminalError] = useState<string | null>(null);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);

  const { isConnected, emit, on, off } = useRunnerSocket(slug as string);

  // Responsive detection
  useEffect(() => {
    const checkResponsive = () => {
      const width = window.innerWidth;
      const newIsMobile = width < 768;
      const newIsTablet = width >= 768 && width < 1024;

      setIsMobile(newIsMobile);
      setIsTablet(newIsTablet);

      // Auto-collapse sidebar on mobile
      if (newIsMobile && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }

      // Auto-collapse bottom panel on very small screens
      if (width < 640 && !bottomPanelCollapsed) {
        setBottomPanelCollapsed(true);
      }
    };

    checkResponsive();
    window.addEventListener("resize", checkResponsive);
    return () => window.removeEventListener("resize", checkResponsive);
  }, []);

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
        toast.success("File saved successfully");
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
    setTerminalConnectionStatus("disconnected");
    console.log("🖥️ Terminal closed by user");
  }, []);

  const handleTerminalError = useCallback((error: string) => {
    setTerminalError(error);
    setTerminalConnectionStatus("disconnected");
    console.error("🖥️ Terminal error:", error);
  }, []);

  // Terminal utility functions
  const clearTerminal = useCallback(() => {
    terminalRef.current?.clear();
  }, []);

  const resetTerminal = useCallback(() => {
    terminalRef.current?.reset();
    handleRequestTerminal();
  }, [handleRequestTerminal]);

  const reconnectTerminal = useCallback(() => {
    terminalRef.current?.reconnect();
  }, []);

  const focusTerminal = useCallback(() => {
    terminalRef.current?.focus();
  }, []);

  const scrollTerminalToBottom = useCallback(() => {
    terminalRef.current?.scrollToBottom();
  }, []);

  // Search functionality for terminal
  const [terminalSearchTerm, setTerminalSearchTerm] = useState("");
  const searchInTerminal = useCallback((term: string) => {
    if (term && terminalRef.current) {
      return terminalRef.current.search(term);
    }
    return false;
  }, []);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<TerminalRef>(null);

  // Enhanced keyboard shortcuts handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { ctrlKey, shiftKey, key, metaKey } = event;
      const isCtrlOrCmd = ctrlKey || metaKey;

      // Disable some shortcuts on mobile
      if (isMobile) return;

      // Ctrl+Shift+E: Focus sidebar (Explorer)
      if (isCtrlOrCmd && shiftKey && key.toLowerCase() === "e") {
        event.preventDefault();
        if (sidebarCollapsed) {
          setSidebarCollapsed(false);
        }
        sidebarRef.current?.focus();
        return;
      }

      // Ctrl+B: Toggle sidebar
      if (isCtrlOrCmd && !shiftKey && key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarCollapsed((prev) => !prev);
        return;
      }

      // Ctrl+`: Toggle terminal
      if (isCtrlOrCmd && key === "`") {
        event.preventDefault();
        setTerminalVisible((prev) => {
          const newValue = !prev;
          if (newValue) {
            setActiveBottomPanel("terminal");
            setBottomPanelCollapsed(false);
            // Focus terminal after showing
            setTimeout(() => focusTerminal(), 100);
          }
          return newValue;
        });
        return;
      }

      // Ctrl+Shift+Y: Toggle output
      if (isCtrlOrCmd && shiftKey && key.toLowerCase() === "y") {
        event.preventDefault();
        setOutputVisible((prev) => {
          const newValue = !prev;
          if (newValue) {
            setActiveBottomPanel("output");
            setBottomPanelCollapsed(false);
          }
          return newValue;
        });
        return;
      }

      // Ctrl+Shift+C: Clear terminal
      if (
        isCtrlOrCmd &&
        shiftKey &&
        key.toLowerCase() === "c" &&
        activeBottomPanel === "terminal"
      ) {
        event.preventDefault();
        clearTerminal();
        return;
      }

      // Ctrl+Shift+R: Reset terminal
      if (
        isCtrlOrCmd &&
        shiftKey &&
        key.toLowerCase() === "r" &&
        activeBottomPanel === "terminal"
      ) {
        event.preventDefault();
        resetTerminal();
        return;
      }

      // Ctrl+Shift+F: Search in terminal
      if (
        isCtrlOrCmd &&
        shiftKey &&
        key.toLowerCase() === "f" &&
        activeBottomPanel === "terminal"
      ) {
        event.preventDefault();
        const term = prompt("Search in terminal:");
        if (term) {
          searchInTerminal(term);
        }
        return;
      }

      // Ctrl+1: Focus editor
      if (isCtrlOrCmd && key === "1") {
        event.preventDefault();
        editorRef.current?.focus();
        return;
      }

      // Ctrl+2: Focus terminal
      if (isCtrlOrCmd && key === "2") {
        event.preventDefault();
        if (!terminalVisible) {
          setTerminalVisible(true);
          setActiveBottomPanel("terminal");
          setBottomPanelCollapsed(false);
        }
        setTimeout(() => focusTerminal(), 100);
        return;
      }

      // Escape: Focus editor from anywhere
      if (key === "Escape") {
        editorRef.current?.focus();
        return;
      }
    },
    [
      isMobile,
      sidebarCollapsed,
      activeBottomPanel,
      terminalVisible,
      clearTerminal,
      resetTerminal,
      searchInTerminal,
      focusTerminal,
    ],
  );

  // Register keyboard shortcuts
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Calculate if bottom panel should be shown
  const showBottomPanel =
    (terminalVisible || outputVisible) && !bottomPanelCollapsed;

  // Auto-scroll terminal to bottom when new data arrives
  useEffect(() => {
    if (activeBottomPanel === "terminal" && terminalVisible) {
      const timer = setTimeout(() => {
        scrollTerminalToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeBottomPanel, terminalVisible, scrollTerminalToBottom]);

  // Responsive sidebar handler
  const handleSidebarToggle = () => {
    console.log(sidebarCollapsed);
    setSidebarCollapsed((prev) => !prev);
  };

  // Mobile bottom panel handler
  const handleBottomPanelToggle = () => {
    setBottomPanelCollapsed((prev) => !prev);
    if (!bottomPanelCollapsed && isMobile) {
      // On mobile, maximize bottom panel when opening
      setIsTerminalMaximized(true);
    }
  };

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
    <div className="h-screen w-full bg-gray-800 flex flex-col pt-12">
      {/* Mobile header */}
      {isMobile && (
        <div className="h-12 bg-gray-900 border-b border-gray-600 flex items-center justify-between px-3 relative z-50">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-8 w-8 p-0 text-gray-300 hover:text-white"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <span className="text-white text-sm font-medium truncate">
              {filePath || "Sandbox"}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBottomPanelToggle}
              className="h-8 px-2 text-xs text-gray-300 hover:text-white"
            >
              <TerminalIcon className="h-3 w-3" />
            </Button>
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <div
                className={`w-2 h-2 rounded-full ${
                  terminalConnectionStatus === "connected"
                    ? "bg-green-500"
                    : terminalConnectionStatus === "connecting"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
            </div>
          </div>

          {/* Mobile menu overlay */}
          {mobileMenuOpen && (
            <div className="absolute top-12 left-0 right-0 bg-gray-900 border-b border-gray-600 p-3 shadow-lg">
              <div className="flex flex-col space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSidebarCollapsed(false); // Show sidebar
                    setMobileMenuOpen(false); // Close menu
                  }}
                  className="justify-start text-gray-300 hover:text-white"
                >
                  <PanelLeftOpen className="h-4 w-4 mr-2" />
                  Toggle Explorer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTerminalVisible(true);
                    setActiveBottomPanel("terminal");
                    setBottomPanelCollapsed(false);
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start text-gray-300 hover:text-white"
                >
                  <TerminalIcon className="h-4 w-4 mr-2" />
                  Terminal
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOutputVisible(true);
                    setActiveBottomPanel("output");
                    setBottomPanelCollapsed(false);
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start text-gray-300 hover:text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Output
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop top bar */}
      {!isMobile && (
        <div className="h-10 bg-gray-800 border-b border-gray-600 flex items-center px-3 space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSidebarToggle}
            className="h-6 w-6 p-0 text-gray-300 hover:text-white"
            title={`${sidebarCollapsed ? "Show" : "Hide"} Sidebar (Ctrl+B)`}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>

          {/* Connection status indicator */}
          <div className="flex items-center space-x-2 text-xs">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
              title={`Socket: ${isConnected ? "Connected" : "Disconnected"}`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                terminalConnectionStatus === "connected"
                  ? "bg-green-500"
                  : terminalConnectionStatus === "connecting"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              title={`Terminal: ${terminalConnectionStatus}`}
            />
            {isLoading && (
              <div
                className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"
                title="Loading..."
              />
            )}
          </div>

          <div className="flex items-center space-x-1 ml-auto">
            <Button
              variant={
                activeBottomPanel === "terminal" && terminalVisible
                  ? "secondary"
                  : "ghost"
              }
              size="sm"
              onClick={() => {
                if (activeBottomPanel === "terminal" && terminalVisible) {
                  setTerminalVisible(false);
                } else {
                  setTerminalVisible(true);
                  setActiveBottomPanel("terminal");
                  setBottomPanelCollapsed(false);
                  setTimeout(() => focusTerminal(), 100);
                }
              }}
              className="h-6 px-2 text-xs text-gray-300 hover:text-white"
              title="Toggle Terminal (Ctrl+`)"
            >
              <TerminalIcon className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Terminal</span>
              {terminalError && (
                <span className="ml-1 text-red-400 text-xs">!</span>
              )}
            </Button>

            <Button
              variant={
                activeBottomPanel === "output" && outputVisible
                  ? "secondary"
                  : "ghost"
              }
              size="sm"
              onClick={() => {
                if (activeBottomPanel === "output" && outputVisible) {
                  setOutputVisible(false);
                } else {
                  setOutputVisible(true);
                  setActiveBottomPanel("output");
                  setBottomPanelCollapsed(false);
                }
              }}
              className="h-6 px-2 text-xs text-gray-300 hover:text-white"
              title="Toggle Output (Ctrl+Shift+Y)"
            >
              <Play className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Output</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile layout */}
        {isMobile ? (
          <div className="flex-1 flex flex-col">
            {/* Mobile sidebar overlay */}
            {!sidebarCollapsed && (
              <div
                className="fixed inset-0 z-40 bg-black bg-opacity-50"
                onClick={() => setSidebarCollapsed(true)}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-full bg-gray-900 border-r border-gray-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="h-full">
                    <div className="h-12 bg-gray-800 border-b border-gray-600 flex items-center justify-between px-3">
                      <span className="text-white text-sm font-medium">
                        Explorer
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarCollapsed(true)}
                        className="h-6 w-6 p-0 text-gray-300 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="h-full pt-12">
                      <FileTree
                        tree={tree}
                        fetchDir={fetchDir}
                        fetchContent={fetchContent}
                        onAction={handleFileTreeAction}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile editor */}
            <div
              className={`flex-1 ${!bottomPanelCollapsed && showBottomPanel ? "h-1/2" : "h-full"}`}
            >
              <div ref={editorRef} className="h-full">
                <Editor
                  sendDiff={updateContent}
                  code={code}
                  setCode={setCode}
                  fileType={fileType}
                />
              </div>
            </div>

            {/* Mobile bottom panel */}
            {!bottomPanelCollapsed && showBottomPanel && (
              <div className="h-1/2 border-t border-gray-600 flex flex-col">
                <div className="h-10 bg-gray-200 border-b flex items-center justify-between px-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setActiveBottomPanel("terminal");
                        setTerminalVisible(true);
                      }}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        activeBottomPanel === "terminal" && terminalVisible
                          ? "bg-white text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Terminal
                    </button>
                    <button
                      onClick={() => {
                        setActiveBottomPanel("output");
                        setOutputVisible(true);
                      }}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        activeBottomPanel === "output" && outputVisible
                          ? "bg-white text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Output
                    </button>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Terminal-specific controls */}
                    {activeBottomPanel === "terminal" && terminalVisible && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearTerminal}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                          title="Clear Terminal"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetTerminal}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                          title="Reset Terminal"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const term = prompt("Search in terminal:");
                            if (term) searchInTerminal(term);
                          }}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                          title="Search in Terminal"
                        >
                          <Search className="h-3 w-3" />
                        </Button>
                      </>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setIsTerminalMaximized(!isTerminalMaximized)
                      }
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                      title={isTerminalMaximized ? "Restore" : "Maximize"}
                    >
                      {isTerminalMaximized ? (
                        <Minimize2 className="h-3 w-3" />
                      ) : (
                        <Maximize2 className="h-3 w-3" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBottomPanelToggle}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                      title="Close Panel"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Panel content */}
                <div className="flex-1 overflow-hidden">
                  {activeBottomPanel === "terminal" && terminalVisible && (
                    <Terminal
                      ref={terminalRef}
                      onSendData={handleTerminalSendData}
                      onRequestTerminal={handleRequestTerminal}
                      onTerminalResize={handleTerminalResize}
                      onReady={handleTerminalReady}
                      onClose={handleTerminalClose}
                      onError={handleTerminalError}
                      className="h-full"
                    />
                  )}
                  {activeBottomPanel === "output" && outputVisible && (
                    <Output
                      replId={slug as string}
                      isVisible={outputVisible}
                      className="h-full"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Desktop layout
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Sidebar Panel */}
            {!sidebarCollapsed && (
              <>
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                  <div ref={sidebarRef} className="h-full">
                    <FileTree
                      tree={tree}
                      fetchDir={fetchDir}
                      fetchContent={fetchContent}
                      onAction={handleFileTreeAction}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}

            {/* Main content area (Editor + Bottom panel) */}
            <ResizablePanel defaultSize={sidebarCollapsed ? 100 : 80}>
              <ResizablePanelGroup direction="vertical" className="h-full">
                {/* Code Editor */}
                <ResizablePanel
                  defaultSize={showBottomPanel ? 70 : 100}
                  minSize={30}
                >
                  <div ref={editorRef} className="h-full">
                    <Editor
                      sendDiff={updateContent}
                      code={code}
                      setCode={setCode}
                      fileType={fileType}
                    />
                  </div>
                </ResizablePanel>

                {/* Bottom Panel (Terminal/Output) */}
                {showBottomPanel && (
                  <>
                    <ResizableHandle />
                    <ResizablePanel
                      defaultSize={30}
                      minSize={15}
                      className={isTerminalMaximized ? "flex-1" : ""}
                    >
                      <div className="h-full bg-white border-t border-gray-200">
                        {/* Tab buttons for bottom panel */}
                        <div className="h-8 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-2">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => {
                                setActiveBottomPanel("terminal");
                                setTerminalVisible(true);
                                setTimeout(() => focusTerminal(), 100);
                              }}
                              className={`px-3 py-1 text-xs rounded-t border-b-2 transition-colors ${
                                activeBottomPanel === "terminal" &&
                                terminalVisible
                                  ? "bg-white border-blue-500 text-gray-900"
                                  : "bg-gray-100 border-transparent text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              <TerminalIcon className="h-3 w-3 mr-1 inline" />
                              Terminal
                              {terminalError && (
                                <span className="ml-1 text-red-500 text-xs">
                                  !
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setActiveBottomPanel("output");
                                setOutputVisible(true);
                              }}
                              className={`px-3 py-1 text-xs rounded-t border-b-2 transition-colors ${
                                activeBottomPanel === "output" && outputVisible
                                  ? "bg-white border-blue-500 text-gray-900"
                                  : "bg-gray-100 border-transparent text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              <Play className="h-3 w-3 mr-1 inline" />
                              Output
                            </button>
                          </div>

                          {/* Terminal-specific controls */}
                          {activeBottomPanel === "terminal" &&
                            terminalVisible && (
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={clearTerminal}
                                  className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                                  title="Clear Terminal"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={resetTerminal}
                                  className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                                  title="Reset Terminal"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const term = prompt("Search in terminal:");
                                    if (term) searchInTerminal(term);
                                  }}
                                  className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                                  title="Search in Terminal (Ctrl+Shift+F)"
                                >
                                  <Search className="h-3 w-3" />
                                </Button>
                              </div>
                            )}

                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setIsTerminalMaximized(!isTerminalMaximized)
                              }
                              className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                              title={
                                isTerminalMaximized ? "Restore" : "Maximize"
                              }
                            >
                              {isTerminalMaximized ? (
                                <Minimize2 className="h-3 w-3" />
                              ) : (
                                <Maximize2 className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (activeBottomPanel === "terminal") {
                                  setTerminalVisible(false);
                                } else {
                                  setOutputVisible(false);
                                }
                              }}
                              className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Panel content */}
                        <div
                          className="h-full overflow-hidden"
                          style={{ height: "calc(100% - 2rem)" }}
                        >
                          {activeBottomPanel === "terminal" &&
                            terminalVisible && (
                              <Terminal
                                ref={terminalRef}
                                onSendData={handleTerminalSendData}
                                onRequestTerminal={handleRequestTerminal}
                                onReady={handleTerminalReady}
                                onClose={handleTerminalClose}
                                onError={handleTerminalError}
                                className="h-full"
                              />
                            )}
                          {activeBottomPanel === "output" && outputVisible && (
                            <Output
                              replId={slug as string}
                              isVisible={outputVisible}
                              className="h-full"
                            />
                          )}
                        </div>
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
};

export default Sandbox;
