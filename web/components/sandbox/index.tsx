import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Terminal as TerminalIcon,
  Play,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  Maximize2,
  Minimize2,
} from "lucide-react";

import Editor from "./Editor";
import FileTree, { Tree } from "./FileTree";
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

  // Terminal-specific state
  const terminalSessionIdRef = useRef<string>("");
  const [terminalConnectionStatus, setTerminalConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [terminalError, setTerminalError] = useState<string | null>(null);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);

  const { isConnected, emit, on, off } = useRunnerSocket(slug as string);

  useEffect(() => {
    if (!isConnected) return;

    emit("Connection");

    on("Loaded", (data) => {
      console.log("Received Loaded Data", data);
      setTree({
        "": data.rootContents,
      });
    });

    // Listen for dir response
    on("fetchDirResponse", (data) => {
      console.log("📁 Dir contents:", data);
      setTree((prev) => ({ ...prev, [data.path]: data.contents }));
    });

    // Listen for content response
    on("fetchContentResponse", (data) => {
      console.log("📄 File contents:", data);
      setCode(data.content);
      setFilePath(data.path);
      setFileType(data.path.split(".").pop()?.toLowerCase() || "txt");
    });

    // Enhanced terminal event handlers
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
      console.log("🖥️ Terminal Connected:", data);
    });

    on("terminalClosed", (data) => {
      setTerminalConnectionStatus("disconnected");
      terminalRef.current?.writeData(
        "\r\n\x1b[31m✗ Terminal session closed\x1b[0m\r\n",
      );
      console.log("🖥️ Terminal Closed:", data);
    });

    on("terminalError", (data) => {
      setTerminalError(data.error || "Unknown terminal error");
      setTerminalConnectionStatus("disconnected");
      terminalRef.current?.writeData(
        `\r\n\x1b[31m✗ Terminal error: ${data.error}\x1b[0m\r\n`,
      );
      console.error("🖥️ Terminal Error:", data);
    });

    return () => {
      off("Loaded");
      off("fetchDirResponse");
      off("fetchContentResponse");
      off("terminalResponse");
      off("terminalConnected");
      off("terminalClosed");
      off("terminalError");
    };
  }, [isConnected]);

  // Editor Helpers
  const fetchDir = async (path: string) => emit("fetchDir", { Dir: path });
  const fetchContent = async (path: string) => emit("fetchContent", { path });
  const updateContent = async (patch: string) =>
    emit("updateContent", { path: filePath, patch });

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
  const showBottomPanel = terminalVisible || outputVisible;

  // Auto-scroll terminal to bottom when new data arrives
  useEffect(() => {
    if (activeBottomPanel === "terminal" && terminalVisible) {
      const timer = setTimeout(() => {
        scrollTerminalToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeBottomPanel, terminalVisible, scrollTerminalToBottom]);

  if (!tree) {
    return (
      <div className="h-screen w-full bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Sandbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-800 flex flex-col pt-12">
      {/* Top bar with controls */}
      <div className="h-10 bg-gray-800 border-b border-gray-600 flex items-center px-3 space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
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
                setTimeout(() => focusTerminal(), 100);
              }
            }}
            className="h-6 px-2 text-xs text-gray-300 hover:text-white"
            title="Toggle Terminal (Ctrl+`)"
          >
            <TerminalIcon className="h-3 w-3 mr-1" />
            Terminal
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
              }
            }}
            className="h-6 px-2 text-xs text-gray-300 hover:text-white"
            title="Toggle Output (Ctrl+Shift+Y)"
          >
            <Play className="h-3 w-3 mr-1" />
            Output
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar Panel */}
          {!sidebarCollapsed && (
            <>
              <ResizablePanel
                defaultSize={20}
                minSize={15}
                maxSize={40}
                className="min-w-0"
              >
                <div
                  ref={sidebarRef}
                  tabIndex={-1}
                  className="h-full focus:outline-none"
                >
                  <FileTree
                    tree={tree}
                    fetchDir={fetchDir}
                    fetchContent={fetchContent}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Main content area (Editor + Bottom panel) */}
          <ResizablePanel
            defaultSize={sidebarCollapsed ? 100 : 80}
            className="min-w-0"
          >
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Code Editor */}
              <ResizablePanel
                defaultSize={
                  isTerminalMaximized ? 0 : showBottomPanel ? 70 : 100
                }
                minSize={isTerminalMaximized ? 0 : 30}
                className="min-h-0"
              >
                <div
                  ref={editorRef}
                  tabIndex={-1}
                  className="h-full focus:outline-none"
                >
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
                  <ResizableHandle withHandle />
                  <ResizablePanel
                    defaultSize={isTerminalMaximized ? 100 : 30}
                    minSize={15}
                    maxSize={isTerminalMaximized ? 100 : 70}
                    className="min-h-0"
                  >
                    <div className="h-full relative">
                      {/* Tab buttons for bottom panel */}
                      <div className="absolute top-0 left-0 right-0 h-8 bg-gray-200 border-b flex items-center px-2 z-10">
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
                            <div className="flex items-center space-x-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearTerminal}
                                className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                                title="Clear Terminal (Ctrl+Shift+C)"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetTerminal}
                                className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                                title="Reset Terminal (Ctrl+Shift+R)"
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

                        <div className="flex items-center space-x-1 ml-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setIsTerminalMaximized(!isTerminalMaximized)
                            }
                            className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
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
                      <div className="h-full pt-8">
                        {activeBottomPanel === "terminal" &&
                          terminalVisible && (
                            <Terminal
                              onSendData={handleTerminalSendData}
                              onRequestTerminal={handleRequestTerminal}
                              onTerminalResize={handleTerminalResize}
                              onReady={handleTerminalReady}
                              onClose={handleTerminalClose}
                              onError={handleTerminalError}
                              sessionId={terminalSessionIdRef.current}
                              autoReconnect={true}
                              theme={{
                                background: "#1e1e1e",
                                foreground: "#d4d4d4",
                                cursor: "#d4d4d4",
                                selection: "#264f78",
                              }}
                              fontSize={13}
                              ref={terminalRef}
                            />
                          )}
                        {activeBottomPanel === "output" && outputVisible && (
                          <Output className="h-full" isVisible={true} />
                        )}
                      </div>
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Sandbox;
