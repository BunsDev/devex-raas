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
  onSendData?: (data: string) => void;
  onRequestTerminal?: () => void;
  onTerminalResize?: (cols: number, rows: number) => void;
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
  onReady?: () => void;
  onClose?: () => void;
  onError?: (error: string) => void;
  onDataReceived?: (data: string) => void;
  className?: string;
  style?: React.CSSProperties;
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
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pendingDataRef = useRef<string[]>([]);

    // Use ref to track initialization state instead of useState
    const isInitializedRef = useRef(false);
    // Track if terminal has been requested to prevent infinite calls
    const terminalRequestedRef = useRef(false);
    // Store the current session ID to detect changes
    const currentSessionIdRef = useRef<string | undefined>(sessionId);

    // Initialize terminal - removed isInitialized from dependencies
    const initializeTerminal = useCallback(async () => {
      console.log(
        "Checking initialization:",
        terminalRef.current,
        isInitializedRef.current,
      );

      if (!terminalRef.current) {
        console.error("Terminal container ref is not available");
        return false;
      }

      if (isInitializedRef.current) {
        console.log("Terminal already initialized");
        return true;
      }

      try {
        console.log("Initializing terminal...");

        // Dynamic imports
        const { Terminal } = await import("xterm");
        const { FitAddon } = await import("xterm-addon-fit");
        const { WebLinksAddon } = await import("xterm-addon-web-links");
        const { SearchAddon } = await import("xterm-addon-search");

        // Create terminal instance
        const terminal = new Terminal({
          cols,
          rows,
          fontSize,
          fontFamily,
          theme: { ...defaultTheme, ...theme },
          cursorBlink: true,
          cursorStyle: "block",
          scrollback: 10000,
          convertEol: true,
          allowTransparency: true,
        });

        // Create addons
        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();
        const searchAddon = new SearchAddon();

        // Load addons
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.loadAddon(searchAddon);

        // Open terminal
        terminal.open(terminalRef.current);

        // Store references
        xtermRef.current = terminal;
        fitAddonRef.current = fitAddon;
        searchAddonRef.current = searchAddon;

        // Set up event listeners
        terminal.onData((data: string) => {
          onSendData?.(data);
          onDataReceived?.(data);
        });

        terminal.onResize(({ cols, rows }: { cols: number; rows: number }) => {
          onTerminalResize?.(cols, rows);
        });

        // Fit terminal to container
        setTimeout(() => {
          try {
            fitAddon.fit();
            console.log("Terminal fitted to container");
          } catch (error) {
            console.warn("Failed to fit terminal:", error);
          }
        }, 100);

        // Mark as initialized BEFORE setting other states
        isInitializedRef.current = true;
        setIsReady(true);
        setError(null);

        // Process any pending data
        if (pendingDataRef.current.length > 0) {
          const pendingData = pendingDataRef.current.join("");
          pendingDataRef.current = [];
          terminal.write(pendingData);
        }

        // Call callbacks
        onReady?.();

        // Request terminal connection only if not already requested
        if (!terminalRequestedRef.current) {
          console.log("Requesting terminal connection...");
          onRequestTerminal?.();
          terminalRequestedRef.current = true;
        }

        // Welcome message
        terminal.write("\x1b[2J\x1b[H");
        terminal.write("\x1b[32m🖥️ Terminal ready\x1b[0m\r\n");

        console.log("Terminal initialization successful");
        return true;
      } catch (error) {
        console.error("Terminal initialization failed:", error);
        setError(`Failed to initialize terminal: ${error}`);
        onError?.(`Failed to initialize terminal: ${error}`);
        return false;
      }
    }, [
      cols,
      rows,
      fontSize,
      fontFamily,
      theme,
      onSendData,
      onDataReceived,
      onTerminalResize,
      onReady,
      onRequestTerminal,
      onError,
      // Removed isInitialized dependency
    ]);

    // Handle resize
    const handleResize = useCallback(() => {
      if (fitAddonRef.current && isReady) {
        try {
          fitAddonRef.current.fit();
        } catch (error) {
          console.warn("Failed to resize terminal:", error);
        }
      }
    }, [isReady]);

    // Initialize on mount - simplified dependency array
    useEffect(() => {
      let mounted = true;
      let timeoutId: NodeJS.Timeout;

      const init = async () => {
        // Wait for next tick to ensure DOM is ready
        await new Promise((resolve) => setTimeout(resolve, 0));

        console.log(
          "Init check:",
          mounted,
          terminalRef.current,
          !isInitializedRef.current,
        );
        if (mounted && terminalRef.current && !isInitializedRef.current) {
          const success = await initializeTerminal();
          if (!success && mounted) {
            // Retry once after a delay
            timeoutId = setTimeout(async () => {
              if (mounted && !isInitializedRef.current) {
                await initializeTerminal();
              }
            }, 1000);
          }
        }
      };

      init();

      return () => {
        mounted = false;
        clearTimeout(timeoutId);
        console.log("Cleanup: disposing terminal");

        // Cleanup terminal instance
        if (xtermRef.current) {
          try {
            xtermRef.current.dispose();
          } catch (error) {
            console.warn("Error disposing terminal:", error);
          }
          xtermRef.current = null;
        }

        // Reset refs and state
        fitAddonRef.current = null;
        searchAddonRef.current = null;
        isInitializedRef.current = false;
        terminalRequestedRef.current = false; // Reset terminal request flag
        setIsReady(false);
        pendingDataRef.current = [];
      };
    }, []); // Empty dependency array - only run on mount/unmount

    // Handle window resize
    useEffect(() => {
      const resizeObserver = new ResizeObserver(handleResize);

      if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
      }

      window.addEventListener("resize", handleResize);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", handleResize);
      };
    }, [handleResize]);

    // Handle session changes
    useEffect(() => {
      // Check if session ID actually changed
      const sessionChanged = currentSessionIdRef.current !== sessionId;
      currentSessionIdRef.current = sessionId;
    }, [sessionId, isReady, autoReconnect]);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        writeData: (data: string) => {
          if (!data) return;

          if (xtermRef.current && isReady) {
            try {
              xtermRef.current.write(data);
            } catch (error) {
              console.warn("Failed to write data:", error);
              pendingDataRef.current.push(data);
            }
          } else {
            pendingDataRef.current.push(data);
          }
        },

        clear: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.clear();
          }
        },

        focus: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.focus();
          }
        },

        blur: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.blur();
          }
        },

        resize: (newCols?: number, newRows?: number) => {
          if (xtermRef.current && isReady) {
            if (newCols && newRows) {
              try {
                xtermRef.current.resize(newCols, newRows);
              } catch (error) {
                console.warn("Failed to resize terminal:", error);
              }
            } else {
              handleResize();
            }
          }
        },

        getSelection: () => {
          return xtermRef.current?.getSelection() || "";
        },

        selectAll: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.selectAll();
          }
        },

        search: (term: string) => {
          if (searchAddonRef.current && isReady) {
            return searchAddonRef.current.findNext(term);
          }
          return false;
        },

        findNext: (term: string) => {
          if (searchAddonRef.current && isReady) {
            return searchAddonRef.current.findNext(term);
          }
          return false;
        },

        findPrevious: (term: string) => {
          if (searchAddonRef.current && isReady) {
            return searchAddonRef.current.findPrevious(term);
          }
          return false;
        },

        scrollToBottom: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.scrollToBottom();
          }
        },

        scrollToTop: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.scrollToTop();
          }
        },

        reset: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.reset();
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
          terminalRequestedRef.current = false; // Reset request flag
          setIsReady(false);
          pendingDataRef.current = [];
        },

        reconnect: () => {
          if (!isInitializedRef.current) {
            terminalRequestedRef.current = false; // Reset flag before reconnecting
            initializeTerminal();
          } else if (isReady && !terminalRequestedRef.current) {
            console.log("Reconnecting terminal...");
            onRequestTerminal?.();
            terminalRequestedRef.current = true;
          }
        },

        isReady: () => {
          return isReady;
        },
      }),
      [isReady, handleResize, initializeTerminal, onRequestTerminal],
    );

    // Show error state
    if (error) {
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
            color: defaultTheme.red,
            fontFamily,
            ...style,
          }}
        >
          <div className="text-center">
            <div>Terminal Error</div>
            <div className="text-sm mt-2">{error}</div>
            <button
              onClick={() => {
                setError(null);
                isInitializedRef.current = false;
                terminalRequestedRef.current = false; // Reset request flag
                setIsReady(false);
                initializeTerminal();
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
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
        {!isReady && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Loading terminal...</span>
          </div>
        )}
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
