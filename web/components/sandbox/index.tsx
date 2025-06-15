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
      setFileType(data.path.split(".").pop()?.toLowerCase() || "txt");
    });

    // Listen for terminal data
    on("terminalResponse", (data) => {
      terminalRef.current?.writeData(data);
      console.log("🖥️ Terminal output:", data);
    });

    on("terminalClosed", (data) => {
      terminalRef.current?.writeData(
        "\r\n\x1b[31mTerminal session closed\x1b[0m\r\n",
      );
      console.log("🖥️ Terminal Closed");
    });

    return () => {
      off("Loaded");
      off("fetchDirResponse");
      off("fetchContentResponse");
      off("terminalResponse");
    };
  }, [isConnected]);

  // Editor Helpers
  const fetchDir = async (path: string) => emit("fetchDir", { Dir: path });
  const fetchContent = async (path: string) => emit("fetchContent", { path });

  // Terminal Helpers
  const handleTerminalSendData = (data: string) =>
    emit("terminalInput", { data, terminalId: 12 });
  const handleRequestTerminal = () => emit("requestTerminal");
  const handleTerminalResize = () => {};

  const handleTerminalReady = useCallback(() => {
    terminalRef.current?.writeData(
      "Terminal initialized. Connecting to server...\r\n",
    );
  }, []);

  // Handle terminal close
  const handleTerminalClose = useCallback(() => {
    console.log("Close the Terminal");
  }, []);

  // Handle terminal error
  const handleTerminalError = useCallback((error: string) => {
    console.error("Terminal error:", error);
  }, []);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<TerminalRef>(null);

  // Keyboard shortcuts handler
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

      // Ctrl+1: Focus editor
      if (isCtrlOrCmd && key === "1") {
        event.preventDefault();
        editorRef.current?.focus();
        return;
      }

      // Escape: Focus editor from anywhere
      if (key === "Escape") {
        editorRef.current?.focus();
        return;
      }
    },
    [sidebarCollapsed],
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
    <div className="h-screen w-full bg-gray-100 flex flex-col">
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
              }
            }}
            className="h-6 px-2 text-xs text-gray-300 hover:text-white"
            title="Toggle Terminal (Ctrl+`)"
          >
            <TerminalIcon className="h-3 w-3 mr-1" />
            Terminal
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
                defaultSize={showBottomPanel ? 70 : 100}
                minSize={30}
                className="min-h-0"
              >
                <div
                  ref={editorRef}
                  tabIndex={-1}
                  className="h-full focus:outline-none"
                >
                  <Editor code={code} setCode={setCode} fileType={fileType} />
                </div>
              </ResizablePanel>

              {/* Bottom Panel (Terminal/Output) */}
              {showBottomPanel && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel
                    defaultSize={30}
                    minSize={15}
                    maxSize={70}
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
                          className="ml-auto h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
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
