"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import "xterm/css/xterm.css";

interface TerminalProps {
  // WebSocket related props (passed from parent)
  onSendData?: (data: string) => void;
  onRequestTerminal?: () => void;
  onTerminalResize?: (cols: number, rows: number) => void;

  // Terminal configuration
  theme?: {
    background?: string;
    foreground?: string;
    cursor?: string;
    selection?: string;
    black?: string;
    red?: string;
    green?: string;
    yellow?: string;
    blue?: string;
    magenta?: string;
    cyan?: string;
    white?: string;
    brightBlack?: string;
    brightRed?: string;
    brightGreen?: string;
    brightYellow?: string;
    brightBlue?: string;
    brightMagenta?: string;
    brightCyan?: string;
    brightWhite?: string;
  };

  fontSize?: number;
  fontFamily?: string;
  cols?: number;
  rows?: number;

  // Event handlers
  onReady?: () => void;
  onClose?: () => void;
  onError?: (error: string) => void;

  // Data handling
  onDataReceived?: (data: string) => void;

  className?: string;
  style?: React.CSSProperties;

  // New props for better session management
  sessionId?: string;
  autoReconnect?: boolean;
}

export interface TerminalRef {
  writeData: (data: string) => void;
  clear: () => void;
  focus: () => void;
  blur: () => void;
  resize: (cols?: number, rows?: number) => void;
  getSelection: () => string;
  selectAll: () => void;
  search: (term: string) => boolean;
  findNext: (term: string) => boolean;
  findPrevious: (term: string) => boolean;
  scrollToBottom: () => void;
  scrollToTop: () => void;
  reset: () => void;
  dispose: () => void;
  reconnect: () => void;
  isReady: () => boolean;
}

const defaultTheme = {
  background: "#1e1e1e",
  foreground: "#d4d4d4",
  cursor: "#d4d4d4",
  selection: "#264f78",
  black: "#000000",
  red: "#cd3131",
  green: "#0dbc79",
  yellow: "#e5e510",
  blue: "#2472c8",
  magenta: "#bc3fbc",
  cyan: "#11a8cd",
  white: "#e5e5e5",
  brightBlack: "#666666",
  brightRed: "#f14c4c",
  brightGreen: "#23d18b",
  brightYellow: "#f5f543",
  brightBlue: "#3b8eea",
  brightMagenta: "#d670d6",
  brightCyan: "#29b8db",
  brightWhite: "#e5e5e5",
};

const TerminalComponent = forwardRef<TerminalRef, TerminalProps>(
  (
    {
      onSendData,
      onRequestTerminal,
      onTerminalResize,
      theme = defaultTheme,
      fontSize = 14,
      fontFamily = '"Cascadia Code", "Fira Code", "SF Mono", Monaco, "Inconsolata", "Roboto Mono", "Source Code Pro", monospace',
      cols = 80,
      rows = 24,
      onReady,
      onClose,
      onError,
      onDataReceived,
      className = "",
      style = {},
      sessionId,
      autoReconnect = true,
    },
    ref,
  ) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<any>(null);
    const fitAddonRef = useRef<any>(null);
    const searchAddonRef = useRef<any>(null);
    const isInitializedRef = useRef(false);
    const isConnectedRef = useRef(false);
    const pendingDataRef = useRef<string[]>([]);
    const resizeTimeoutRef = useRef<NodeJS.Timeout>(undefined);
    const [isClient, setIsClient] = useState(false);
    const [terminalReady, setTerminalReady] = useState(false);
    const [connectionState, setConnectionState] = useState<
      "disconnected" | "connecting" | "connected"
    >("disconnected");

    // Ensure we're on the client side
    useEffect(() => {
      setIsClient(true);
    }, []);

    // Process pending data when terminal becomes ready
    useEffect(() => {
      if (
        terminalReady &&
        isConnectedRef.current &&
        pendingDataRef.current.length > 0
      ) {
        const pendingData = pendingDataRef.current.join("");
        pendingDataRef.current = [];
        if (xtermRef.current && pendingData) {
          try {
            xtermRef.current.write(pendingData);
          } catch (error) {
            console.warn("Failed to write pending data:", error);
          }
        }
      }
    }, [terminalReady, connectionState]);

    // Initialize terminal
    const initializeTerminal = useCallback(async () => {
      if (!terminalRef.current || isInitializedRef.current || !isClient) return;

      try {
        setConnectionState("connecting");

        // Dynamically import xterm modules
        const { Terminal } = await import("xterm");
        const { FitAddon } = await import("xterm-addon-fit");
        const { WebLinksAddon } = await import("xterm-addon-web-links");
        const { SearchAddon } = await import("xterm-addon-search");

        // Create terminal instance with improved configuration
        const terminal = new Terminal({
          cols,
          rows,
          fontSize,
          fontFamily,
          theme: { ...defaultTheme, ...theme },
          cursorBlink: true,
          cursorStyle: "block",
          scrollback: 10000,
          tabStopWidth: 4,
          convertEol: true,
          disableStdin: false,
          macOptionIsMeta: true,
          rightClickSelectsWord: true,
          screenReaderMode: false,
          allowTransparency: true,
          // Important: Enable proper terminal behavior
          windowsMode: false,
          altClickMovesCursor: false,
          logLevel: "warn",
        });

        // Create addons
        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        const searchAddon = new SearchAddon();

        // Load addons
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.loadAddon(searchAddon);

        // Open terminal in DOM
        terminal.open(terminalRef.current);

        // Fit terminal to container with a small delay to ensure proper sizing
        setTimeout(() => {
          try {
            fitAddon.fit();
          } catch (error) {
            console.warn("Initial fit failed:", error);
          }
        }, 100);

        // Store refs
        xtermRef.current = terminal;
        fitAddonRef.current = fitAddon;
        searchAddonRef.current = searchAddon;

        // Set up event listeners
        setupEventListeners(terminal);

        isInitializedRef.current = true;
        setTerminalReady(true);
        setConnectionState("connected");
        isConnectedRef.current = true;

        // Call onReady callback
        onReady?.();

        // Request terminal session from backend
        onRequestTerminal?.();

        // Write welcome message
        terminal.write("\x1b[2J\x1b[H"); // Clear screen and move cursor to home
        terminal.write(
          "\x1b[32mTerminal initialized. Connecting to server...\x1b[0m\r\n",
        );
      } catch (error) {
        console.error("Failed to initialize terminal:", error);
        setConnectionState("disconnected");
        onError?.(`Failed to initialize terminal: ${error}`);
      }
    }, [
      cols,
      rows,
      fontSize,
      fontFamily,
      theme,
      onReady,
      onRequestTerminal,
      onError,
      isClient,
    ]);

    // Setup event listeners
    const setupEventListeners = useCallback(
      (terminal: any) => {
        // Handle user input with debouncing for better performance
        let inputTimeout: NodeJS.Timeout;
        terminal.onData((data: string) => {
          clearTimeout(inputTimeout);
          inputTimeout = setTimeout(() => {
            if (isConnectedRef.current) {
              onSendData?.(data);
              onDataReceived?.(data);
            }
          }, 10);
        });

        // Handle terminal resize with debouncing
        terminal.onResize(({ cols, rows }: { cols: number; rows: number }) => {
          clearTimeout(resizeTimeoutRef.current);
          resizeTimeoutRef.current = setTimeout(() => {
            onTerminalResize?.(cols, rows);
          }, 250);
        });

        // Handle selection change
        terminal.onSelectionChange(() => {
          // Can be used for copy/paste functionality
        });

        // Handle bell
        terminal.onBell(() => {
          // Handle terminal bell if needed
        });

        // Handle title change
        terminal.onTitleChange((title: string) => {
          // Handle terminal title change if needed
          console.log("Terminal title changed:", title);
        });

        return () => {
          clearTimeout(inputTimeout);
          clearTimeout(resizeTimeoutRef.current);
        };
      },
      [onSendData, onTerminalResize, onDataReceived],
    );

    // Improved resize handler with debouncing
    const handleResize = useCallback(() => {
      if (fitAddonRef.current && xtermRef.current && terminalReady) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = setTimeout(() => {
          try {
            fitAddonRef.current.fit();
          } catch (error) {
            console.warn("Failed to fit terminal:", error);
          }
        }, 150);
      }
    }, [terminalReady]);

    // Setup resize observer
    useEffect(() => {
      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });

      if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
      }

      // Also listen to window resize
      window.addEventListener("resize", handleResize);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", handleResize);
        clearTimeout(resizeTimeoutRef.current);
      };
    }, [handleResize]);

    // Initialize terminal on mount
    useEffect(() => {
      if (isClient && !isInitializedRef.current) {
        initializeTerminal();
      }

      return () => {
        // Cleanup
        if (xtermRef.current) {
          try {
            xtermRef.current.dispose();
          } catch (error) {
            console.warn("Error disposing terminal:", error);
          }
          xtermRef.current = null;
        }
        isInitializedRef.current = false;
        isConnectedRef.current = false;
        setTerminalReady(false);
        setConnectionState("disconnected");
        pendingDataRef.current = [];
      };
    }, [initializeTerminal, isClient]);

    // Handle session ID changes (reconnection)
    useEffect(() => {
      if (sessionId && terminalReady && autoReconnect) {
        // Session changed, request new terminal
        onRequestTerminal?.();
      }
    }, [sessionId, terminalReady, autoReconnect, onRequestTerminal]);

    // Expose terminal methods via ref
    useImperativeHandle(
      ref,
      () => ({
        writeData: (data: string) => {
          if (!data) return;

          if (xtermRef.current && terminalReady && isConnectedRef.current) {
            try {
              // Process data to handle special characters properly
              xtermRef.current.write(data);
            } catch (error) {
              console.warn("Failed to write data to terminal:", error);
              // Store data for later if terminal is not ready
              pendingDataRef.current.push(data);
            }
          } else {
            // Store data for when terminal becomes ready
            pendingDataRef.current.push(data);
          }
        },

        clear: () => {
          if (xtermRef.current && terminalReady) {
            xtermRef.current.clear();
          }
        },

        focus: () => {
          if (xtermRef.current && terminalReady) {
            xtermRef.current.focus();
          }
        },

        blur: () => {
          if (xtermRef.current && terminalReady) {
            xtermRef.current.blur();
          }
        },

        resize: (newCols?: number, newRows?: number) => {
          if (xtermRef.current && terminalReady) {
            if (newCols && newRows) {
              try {
                xtermRef.current.resize(newCols, newRows);
              } catch (error) {
                console.warn("Failed to resize terminal:", error);
              }
            } else if (fitAddonRef.current) {
              try {
                fitAddonRef.current.fit();
              } catch (error) {
                console.warn("Failed to fit terminal:", error);
              }
            }
          }
        },

        getSelection: () => {
          return xtermRef.current?.getSelection() || "";
        },

        selectAll: () => {
          if (xtermRef.current && terminalReady) {
            xtermRef.current.selectAll();
          }
        },

        search: (term: string) => {
          if (searchAddonRef.current && terminalReady) {
            return searchAddonRef.current.findNext(term);
          }
          return false;
        },

        findNext: (term: string) => {
          if (searchAddonRef.current && terminalReady) {
            return searchAddonRef.current.findNext(term);
          }
          return false;
        },

        findPrevious: (term: string) => {
          if (searchAddonRef.current && terminalReady) {
            return searchAddonRef.current.findPrevious(term);
          }
          return false;
        },

        scrollToBottom: () => {
          if (xtermRef.current && terminalReady) {
            xtermRef.current.scrollToBottom();
          }
        },

        scrollToTop: () => {
          if (xtermRef.current && terminalReady) {
            xtermRef.current.scrollToTop();
          }
        },

        reset: () => {
          if (xtermRef.current && terminalReady) {
            xtermRef.current.reset();
            // Clear pending data
            pendingDataRef.current = [];
          }
        },

        dispose: () => {
          if (xtermRef.current) {
            try {
              xtermRef.current.dispose();
            } catch (error) {
              console.warn("Error disposing terminal:", error);
            }
            xtermRef.current = null;
          }
          isInitializedRef.current = false;
          isConnectedRef.current = false;
          setTerminalReady(false);
          setConnectionState("disconnected");
          pendingDataRef.current = [];
        },

        reconnect: () => {
          if (!isInitializedRef.current && isClient) {
            initializeTerminal();
          } else if (terminalReady) {
            onRequestTerminal?.();
          }
        },

        isReady: () => {
          return terminalReady && isConnectedRef.current;
        },
      }),
      [terminalReady, isClient, initializeTerminal, onRequestTerminal],
    );

    // Show loading state during SSR or before client hydration
    if (!isClient) {
      return (
        <div
          className={`terminal-container ${className}`}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: defaultTheme.background,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: defaultTheme.foreground,
            fontFamily,
            ...style,
          }}
        >
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Loading terminal...</span>
          </div>
        </div>
      );
    }

    // Show connection state
    if (!terminalReady || connectionState !== "connected") {
      return (
        <div
          className={`terminal-container ${className}`}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: defaultTheme.background,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: defaultTheme.foreground,
            fontFamily,
            ...style,
          }}
        >
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>
              {connectionState === "connecting"
                ? "Connecting to terminal..."
                : "Initializing terminal..."}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`terminal-container ${className}`}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          ...style,
        }}
      >
        <div
          ref={terminalRef}
          className="terminal"
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    );
  },
);

TerminalComponent.displayName = "TerminalComponent";

export default TerminalComponent;
