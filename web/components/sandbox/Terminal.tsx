"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { SearchAddon } from "xterm-addon-search";
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
    },
    ref,
  ) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const searchAddonRef = useRef<SearchAddon | null>(null);
    const isInitializedRef = useRef(false);

    // Initialize terminal
    const initializeTerminal = useCallback(() => {
      if (!terminalRef.current || isInitializedRef.current) return;

      try {
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
          tabStopWidth: 4,
          convertEol: true,
          disableStdin: false,
          macOptionIsMeta: true,
          rightClickSelectsWord: true,
          screenReaderMode: false,
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

        // Open terminal in DOM
        terminal.open(terminalRef.current);

        // Fit terminal to container
        fitAddon.fit();

        // Store refs
        xtermRef.current = terminal;
        fitAddonRef.current = fitAddon;
        searchAddonRef.current = searchAddon;

        // Set up event listeners
        setupEventListeners(terminal);

        isInitializedRef.current = true;

        // Call onReady callback
        onReady?.();

        // Request terminal session from backend
        onRequestTerminal?.();
      } catch (error) {
        console.error("Failed to initialize terminal:", error);
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
    ]);

    // Setup event listeners
    const setupEventListeners = useCallback(
      (terminal: Terminal) => {
        // Handle user input
        terminal.onData((data) => {
          onSendData?.(data);
          onDataReceived?.(data);
        });

        // Handle terminal resize
        terminal.onResize(({ cols, rows }) => {
          onTerminalResize?.(cols, rows);
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
        terminal.onTitleChange((title) => {
          // Handle terminal title change if needed
          console.log("Terminal title changed:", title);
        });
      },
      [onSendData, onTerminalResize, onDataReceived],
    );

    // Handle window resize
    const handleResize = useCallback(() => {
      if (fitAddonRef.current && xtermRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (error) {
          console.warn("Failed to fit terminal:", error);
        }
      }
    }, []);

    // Setup resize observer
    useEffect(() => {
      const resizeObserver = new ResizeObserver(() => {
        // Debounce resize
        const timeoutId = setTimeout(handleResize, 100);
        return () => clearTimeout(timeoutId);
      });

      if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, [handleResize]);

    // Initialize terminal on mount
    useEffect(() => {
      initializeTerminal();

      return () => {
        if (xtermRef.current) {
          xtermRef.current.dispose();
          xtermRef.current = null;
        }
        isInitializedRef.current = false;
      };
    }, [initializeTerminal]);

    // Expose terminal methods via ref
    useImperativeHandle(
      ref,
      () => ({
        writeData: (data: string) => {
          if (xtermRef.current) {
            xtermRef.current.write(data);
          }
        },

        clear: () => {
          if (xtermRef.current) {
            xtermRef.current.clear();
          }
        },

        focus: () => {
          if (xtermRef.current) {
            xtermRef.current.focus();
          }
        },

        blur: () => {
          if (xtermRef.current) {
            xtermRef.current.blur();
          }
        },

        resize: (newCols?: number, newRows?: number) => {
          if (xtermRef.current) {
            if (newCols && newRows) {
              xtermRef.current.resize(newCols, newRows);
            } else if (fitAddonRef.current) {
              fitAddonRef.current.fit();
            }
          }
        },

        getSelection: () => {
          return xtermRef.current?.getSelection() || "";
        },

        selectAll: () => {
          if (xtermRef.current) {
            xtermRef.current.selectAll();
          }
        },

        search: (term: string) => {
          if (searchAddonRef.current) {
            return searchAddonRef.current.findNext(term);
          }
          return false;
        },

        findNext: (term: string) => {
          if (searchAddonRef.current) {
            return searchAddonRef.current.findNext(term);
          }
          return false;
        },

        findPrevious: (term: string) => {
          if (searchAddonRef.current) {
            return searchAddonRef.current.findPrevious(term);
          }
          return false;
        },

        scrollToBottom: () => {
          if (xtermRef.current) {
            xtermRef.current.scrollToBottom();
          }
        },

        scrollToTop: () => {
          if (xtermRef.current) {
            xtermRef.current.scrollToTop();
          }
        },

        reset: () => {
          if (xtermRef.current) {
            xtermRef.current.reset();
          }
        },

        dispose: () => {
          if (xtermRef.current) {
            xtermRef.current.dispose();
            xtermRef.current = null;
          }
          isInitializedRef.current = false;
        },
      }),
      [],
    );

    return (
      <div
        className={`terminal-container ${className}`}
        style={{
          width: "100%",
          height: "100%",
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
