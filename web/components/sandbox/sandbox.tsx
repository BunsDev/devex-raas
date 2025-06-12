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
import CodeEditor from "./editor";
import { FileTree } from "./FileTree";

const Terminal = ({
  className,
  isVisible,
}: {
  className?: string;
  isVisible: boolean;
}) => (
  <div
    className={`bg-black text-white font-mono text-sm h-full ${className} ${!isVisible ? "hidden" : ""}`}
  >
    <div className="p-2 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
      <span className="text-gray-300 text-xs">Terminal</span>
    </div>
    <div className="p-3">
      <div className="text-green-400">$ npm run dev</div>
      <div className="text-gray-300">Starting development server...</div>
      <div className="text-green-400">✓ Ready on http://localhost:3000</div>
      <div className="text-blue-400 mt-2">$ █</div>
    </div>
  </div>
);

const Output = ({
  className,
  isVisible,
}: {
  className?: string;
  isVisible: boolean;
}) => (
  <div
    className={`bg-gray-50 border-t h-full ${className} ${!isVisible ? "hidden" : ""}`}
  >
    <div className="p-2 border-b bg-gray-100 flex items-center justify-between">
      <span className="text-gray-700 text-xs font-semibold">Output</span>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
        <Play className="h-3 w-3" />
      </Button>
    </div>
    <div className="p-3 font-mono text-xs">
      <div className="text-green-600">✓ Build successful</div>
      <div className="text-gray-600">Hello, Developer!</div>
      <div className="text-blue-600">Compilation completed in 1.2s</div>
    </div>
  </div>
);

interface CodingPageProps {}

const CodingPage: React.FC<CodingPageProps> = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [outputVisible, setOutputVisible] = useState(true);
  const [activeBottomPanel, setActiveBottomPanel] = useState<
    "terminal" | "output"
  >("terminal");

  const sidebarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

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
  const currentBottomContent =
    activeBottomPanel === "terminal" ? terminalVisible : outputVisible;

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
                  <FileTree />
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
                  <CodeEditor />
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
                        <Terminal
                          className="h-full"
                          isVisible={
                            activeBottomPanel === "terminal" && terminalVisible
                          }
                        />
                        <Output
                          className="h-full"
                          isVisible={
                            activeBottomPanel === "output" && outputVisible
                          }
                        />
                      </div>
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status bar */}
      <div className="h-6 bg-blue-600 text-white text-xs flex items-center px-3 space-x-4">
        <span>TypeScript</span>
        <span>UTF-8</span>
        <span>Ln 8, Col 25</span>
        <span className="ml-auto">Ready</span>
      </div>
    </div>
  );
};

export default CodingPage;
