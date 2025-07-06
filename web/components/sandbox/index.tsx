import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Dispatch,
  SetStateAction,
  RefObject,
} from "react";
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
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import Editor from "./Editor";
import FileTree, { FileTreeAction, Tree } from "./FileTree";
import Output from "./Output";
import Terminal, { TerminalRef } from "./Terminal";

interface SandboxProps {
  editor: {
    updateContent: (patch: string) => Promise<void>;
    code: string;
    setCode: Dispatch<SetStateAction<string>>;
    fileType: string;
  };

  fileTree: {
    tree: Tree;
    fetchDir: (path: string) => Promise<void>;
    fetchContent: (path: string) => Promise<void>;
    filePath: string;
    handleFileTreeAction: (action: FileTreeAction) => void;
  };
  terminal: {
    ref: RefObject<TerminalRef | null>;
    handleRequest: () => void;
    handleClose: () => void;
    handleError: (error: string) => void;
    handleResize: (cols: number, rows: number) => void;
    handleReady: () => void;
    handleSendData: (data: string) => void;
    status: "connected" | "connecting" | "disconnected";
    error: string | null;
  };
  replId: string;
  isConnected: boolean;
}

const Sandbox: React.FC<SandboxProps> = ({
  editor,
  fileTree,
  terminal,
  replId,
  isConnected,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [outputVisible, setOutputVisible] = useState(true);
  const [activeBottomPanel, setActiveBottomPanel] = useState<
    "terminal" | "output"
  >("terminal");

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);

  // Terminal-specific state
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

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

  // Terminal utility functions
  const focusTerminal = useCallback(() => {
    terminal.ref.current?.focus();
  }, []);

  const clearTerminal = useCallback(() => {
    terminal.ref.current?.clear();
  }, []);

  const resetTerminal = useCallback(() => {
    terminal.ref.current?.reset();
    terminal.handleRequest();
  }, [terminal.handleRequest]);

  const reconnectTerminal = useCallback(() => {
    terminal.ref.current?.reconnect();
  }, []);

  const [terminalSearchTerm, setTerminalSearchTerm] = useState("");
  const searchInTerminal = useCallback((term: string) => {
    if (term && terminal.ref.current) {
      return terminal.ref.current.search(term);
    }
    return false;
  }, []);

  // keyboard shortcuts handler
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

  const scrollTerminalToBottom = useCallback(() => {
    terminal.ref.current?.scrollToBottom();
  }, []);

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

  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col pt-14">
      {/* Mobile header */}
      {isMobile && (
        <div className="h-12 bg-gray-900 border-b border-gray-600 flex items-center justify-between px-3 relative z-50">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-8 w-8 p-0 text-gray-300 hover:text-white"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <span className="text-white text-sm font-medium truncate">
              {fileTree.filePath || "Sandbox"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleBottomPanelToggle}
              className="h-8 px-2 text-xs text-gray-300 hover:text-white"
            >
              <TerminalIcon className="h-3 w-3" />
            </Button>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <div
                className={`w-2 h-2 rounded-full ${
                  terminal.status === "connected"
                    ? "bg-green-500"
                    : terminal.status === "connecting"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
            </div>
          </div>

          {/* Mobile menu overlay */}
          {mobileMenuOpen && (
            <div className="absolute top-12 left-0 right-0 bg-gray-900 border-b border-gray-600 p-3 shadow-lg">
              <div className="flex flex-col gap-2">
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
        <div className="h-10 bg-gray-800 border-b border-gray-600 flex items-center px-3 gap-2">
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
          <div className="flex items-center gap-2 text-xs">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
              title={`Socket: ${isConnected ? "Connected" : "Disconnected"}`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                terminal.status === "connected"
                  ? "bg-green-500"
                  : terminal.status === "connecting"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              title={`Terminal: ${terminal.status}`}
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>

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
              {terminal.error && (
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
                        tree={fileTree.tree}
                        fetchDir={fileTree.fetchDir}
                        fetchContent={fileTree.fetchContent}
                        onAction={fileTree.handleFileTreeAction}
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
                  sendDiff={editor.updateContent}
                  code={editor.code}
                  setCode={editor.setCode}
                  fileType={editor.fileType}
                  showSettings={showSettings}
                  setShowSettings={setShowSettings}
                />
              </div>
            </div>

            {/* Mobile bottom panel */}
            {!bottomPanelCollapsed && showBottomPanel && (
              <div className="h-1/2 border-t border-gray-700 flex flex-col">
                <div className="h-10 bg-gray-800 border-b flex items-center justify-between px-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveBottomPanel("terminal");
                        setTerminalVisible(true);
                      }}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        activeBottomPanel === "terminal" && terminalVisible
                          ? "bg-white text-gray-900"
                          : "text-gray-600 hover:text-gray-100"
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

                  <div className="flex items-center gap-1">
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
                      ref={terminal.ref}
                      onSendData={terminal.handleSendData}
                      onRequestTerminal={terminal.handleRequest}
                      onTerminalResize={terminal.handleResize}
                      onReady={terminal.handleReady}
                      onClose={terminal.handleClose}
                      onError={terminal.handleError}
                      className="h-full"
                    />
                  )}
                  {activeBottomPanel === "output" && outputVisible && (
                    <Output
                      replId={replId}
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
                      tree={fileTree.tree}
                      fetchDir={fileTree.fetchDir}
                      fetchContent={fileTree.fetchContent}
                      onAction={fileTree.handleFileTreeAction}
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
                      sendDiff={editor.updateContent}
                      code={editor.code}
                      setCode={editor.setCode}
                      fileType={editor.fileType}
                      showSettings={showSettings}
                      setShowSettings={setShowSettings}
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
                      <div className="h-full bg-zinc-900 border-t border-gray-800">
                        {/* Tab buttons for bottom panel */}
                        <div className="h-8 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-2">
                          <div className="flex gap-1">
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
                              {terminal.error && (
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
                              <div className="flex items-center gap-1">
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

                          <div className="flex items-center gap-1">
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
                                ref={terminal.ref}
                                onSendData={terminal.handleSendData}
                                onRequestTerminal={terminal.handleRequest}
                                onTerminalResize={terminal.handleResize}
                                onReady={terminal.handleReady}
                                onClose={terminal.handleClose}
                                onError={terminal.handleError}
                                className="h-full"
                              />
                            )}
                          {activeBottomPanel === "output" && outputVisible && (
                            <Output
                              replId={replId}
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
