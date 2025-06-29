"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Activity, Cpu, HardDrive, Wifi, Folder } from "lucide-react";

import {
  HistoryEntry,
  StoredRepl,
  CommandExecutionContext,
} from "@/types/dashboard";
import { createCommandRegistry } from "./commands";
import { CommandExecutor } from "@/lib/dashboard/cmdExecutor";
import { SuggestionEngine } from "@/lib/dashboard/suggestionEngine";

// ASCII Art Banner
const ASCII_BANNER = `

  ██████╗ ███████╗██╗   ██╗██╗  ██╗            ██████╗██╗      ██████╗ ██╗   ██╗██████╗     ██╗██████╗ ███████╗
  ██╔══██╗██╔════╝██║   ██║╚██╗██╔╝    ██╗    ██╔════╝██║     ██╔═══██╗██║   ██║██╔══██╗    ██║██╔══██╗██╔════╝
  ██║  ██║█████╗  ██║   ██║ ╚███╔╝     ╚═╝    ██║     ██║     ██║   ██║██║   ██║██║  ██║    ██║██║  ██║█████╗
  ██║  ██║██╔══╝  ╚██╗ ██╔╝ ██╔██╗     ██╗    ██║     ██║     ██║   ██║██║   ██║██║  ██║    ██║██║  ██║██╔══╝
  ██████╔╝███████╗ ╚████╔╝ ██╔╝ ██╗    ╚═╝    ╚██████╗███████╗╚██████╔╝╚██████╔╝██████╔╝    ██║██████╔╝███████╗
  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝  ╚═╝            ╚═════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝     ╚═╝╚═════╝ ╚══════╝

`;

interface TerminalInterfaceProps {
  userName: string;
  getRepls: () => Promise<StoredRepl[]>;
  createRepl: (templateKey: string, replName: string) => Promise<void>;
  startRepl: (replId: string) => Promise<void>;
  deleteRepl: (replId: string) => Promise<void>;
}

const TerminalInterface: React.FC<TerminalInterfaceProps> = ({
  userName,
  getRepls,
  createRepl,
  startRepl,
  deleteRepl,
}) => {
  // Initialize command system
  const commandRegistry = createCommandRegistry();
  const commandExecutor = new CommandExecutor(commandRegistry);
  const suggestionEngine = new SuggestionEngine(commandRegistry);

  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      type: "success",
      content: ASCII_BANNER,
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      type: "info",
      content: "🚀 Welcome to devX Terminal v2.0.0 - Next Generation CLI",
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      type: "info",
      content:
        '💡 Type "help" to see available commands or "repl create <name> <template>" to get started',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [input, setInput] = useState<string>("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionLabel, setSuggestionLabel] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [repls, setRepls] = useState<StoredRepl[]>([]);
  const [suggestionPosition, setSuggestionPosition] = useState<
    "above" | "below"
  >("below");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingAnimation, setLoadingAnimation] = useState<string>("|");
  const [inputWidth, setInputWidth] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const measurementRef = useRef<HTMLSpanElement>(null);

  const scrollToBottom = useCallback((): void => {
    if (terminalRef.current) {
      setTimeout(() => {
        terminalRef.current!.scrollTop = terminalRef.current!.scrollHeight;
      }, 50);
    }
  }, []);

  const keepInputFocused = useCallback(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Keep input focused at all times
  useEffect(() => {
    const intervalId = setInterval(keepInputFocused, 100);
    return () => clearInterval(intervalId);
  }, [keepInputFocused]);

  useEffect(() => {
    scrollToBottom();
  }, [history, scrollToBottom]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTyping((prev) => !prev);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isLoading) {
      const animationChars = ["|", "/", "-", "\\"];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingAnimation(animationChars[i]);
        i = (i + 1) % animationChars.length;
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  useEffect(() => {
    if (measurementRef.current) {
      setInputWidth(measurementRef.current.offsetWidth);
    }
  }, [input]);

  // Load repls when component mounts
  useEffect(() => {
    const loadRepls = async () => {
      try {
        const storedRepls = await getRepls();
        setRepls(storedRepls);
      } catch (error) {
        console.error("Failed to load repls:", error);
      }
    };
    loadRepls();
  }, [getRepls]);

  // Calculate suggestion box position dynamically
  const calculateSuggestionPosition = useCallback(() => {
    if (!inputContainerRef.current || !terminalRef.current) return;

    const inputContainer = inputContainerRef.current.getBoundingClientRect();
    const terminal = terminalRef.current.getBoundingClientRect();

    const spaceBelow = terminal.bottom - inputContainer.bottom;
    const spaceAbove = inputContainer.top - terminal.top;

    // Minimum space needed for suggestions (estimate)
    const minSuggestionHeight = 150;

    // If there's not enough space below, and there's more space above, show above
    if (spaceBelow < minSuggestionHeight && spaceAbove > spaceBelow) {
      setSuggestionPosition("above");
    } else {
      setSuggestionPosition("below");
    }
  }, []);

  // Recalculate position when suggestions show/hide or window resizes
  useEffect(() => {
    if (showSuggestions) {
      calculateSuggestionPosition();
    }
  }, [showSuggestions, calculateSuggestionPosition]);

  useEffect(() => {
    const handleResize = () => {
      if (showSuggestions) {
        calculateSuggestionPosition();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showSuggestions, calculateSuggestionPosition]);

  // Create execution context
  const executionContext: CommandExecutionContext = {
    userName,
    getRepls,
    createRepl,
    startRepl,
    deleteRepl,
    setHistory,
    repls,
    setRepls,
  };

  const executeCommand = useCallback(
    async (commandLine: string): Promise<void> => {
      setIsLoading(true);
      await commandExecutor.executeCommand(commandLine, executionContext);
      setIsLoading(false);
    },
    [commandExecutor, executionContext],
  );

  const updateSuggestions = useCallback(
    async (currentInput: string): Promise<void> => {
      try {
        const { suggestions: newSuggestions, label } =
          await suggestionEngine.getSuggestions(currentInput, executionContext);
        setSuggestions(newSuggestions);
        setSuggestionLabel(label);
        setShowSuggestions(
          newSuggestions.length > 0 && currentInput.trim().length > 0,
        );
      } catch (error) {
        console.error("Error updating suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [suggestionEngine, executionContext],
  );

  const handleInputChange = (value: string): void => {
    setInput(value);
    updateSuggestions(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !isLoading) {
      const commandLine = input;
      executeCommand(commandLine);
      setCommandHistory((prev) => [...prev, commandLine]);
      setInput("");
      setInputWidth(0);
      setHistoryIndex(-1);
      setShowSuggestions(false);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (suggestions.length === 1) {
        const completed = suggestionEngine.completeInput(input, suggestions[0]);
        setInput(completed);
        setShowSuggestions(false);
      } else if (suggestions.length > 1) {
        setShowSuggestions(true);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string): void => {
    const completed = suggestionEngine.completeInput(input, suggestion);
    setInput(completed);
    setShowSuggestions(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "command":
        return "text-emerald-400";
      case "error":
        return "text-red-400";
      case "success":
        return "text-green-400";
      case "info":
        return "text-blue-400";
      default:
        return "text-gray-300";
    }
  };

  const parser = new DOMParser();

  return (
    <div className="bg-gray-900 text-green-400 font-mono overflow-hidden flex flex-col h-full">
      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-2 sm:p-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600"
        onClick={() => inputRef.current?.focus()}
      >
        {/* History */}
        {history.map((entry, index) => (
          <div key={index} className={`mb-2 ${getTypeColor(entry.type)}`}>
            <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto">
              <div dangerouslySetInnerHTML={{ __html: entry.content }} />
            </pre>
            {entry.timestamp && (
              <div className="text-xs text-gray-500 mt-1">
                [{entry.timestamp}]
              </div>
            )}
          </div>
        ))}

        {/* Input Line */}
        {isLoading ? (
          <div className="flex items-center mt-4">
            <span className="text-gray-400 text-xs sm:text-sm">
              {loadingAnimation} Processing...
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center mt-4 relative">
              <span className="text-emerald-400 mr-1 sm:mr-2 whitespace-nowrap text-xs sm:text-sm">
                ┌─ {userName}@devX ~
              </span>
            </div>
            <div ref={inputContainerRef} className="flex items-center relative">
              <span className="text-emerald-400 mr-1 sm:mr-2 text-xs sm:text-sm">
                └─$
              </span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent border-none outline-none text-green-400 font-mono w-full text-xs sm:text-sm"
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                  disabled={isLoading}
                />
                <span
                  ref={measurementRef}
                  className="absolute invisible whitespace-pre -z-10 font-mono text-xs sm:text-sm"
                >
                  {input}
                </span>

                {/* Blinking Cursor */}
                {!isLoading && (
                  <div
                    ref={caretRef}
                    className={`absolute top-0 w-1 sm:w-2 h-4 sm:h-5 bg-green-400 translate-y-[2px] ${
                      isTyping ? "opacity-100" : "opacity-0"
                    } transition-opacity duration-100`}
                    style={{ left: `${inputWidth}px` }}
                  />
                )}

                {/* Suggestions Dropdown */}
                {!isLoading && showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className={`absolute left-0 z-50 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-32 sm:max-h-48 overflow-y-auto min-w-48 sm:min-w-64 w-full max-w-xs sm:max-w-md ${
                      suggestionPosition === "above"
                        ? "bottom-full mb-2"
                        : "top-full mt-2"
                    }`}
                  >
                    <div className="px-2 sm:px-3 py-1 sm:py-2 bg-gray-700 border-b border-gray-600">
                      <span className="text-xs text-gray-400 font-semibold">
                        {suggestionLabel}
                      </span>
                    </div>
                    <div className="max-h-24 sm:max-h-36 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-2 sm:px-3 py-1 sm:py-2 hover:bg-gray-700 cursor-pointer text-green-400 text-xs sm:text-sm flex items-center transition-colors"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <span className="text-gray-500 mr-1 sm:mr-2">▸</span>
                          <span className="truncate">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-2 sm:px-3 py-1 bg-gray-750 border-t border-gray-600">
                      <span className="text-xs text-gray-500">
                        <span className="hidden sm:inline">
                          ↹ Tab to complete • ↑↓ Navigate • Esc to close
                        </span>
                        <span className="sm:hidden">Tab • ↑↓ • Esc</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 bg-gray-800 px-2 sm:px-4 py-1 sm:py-2 border-t border-gray-700 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center space-x-2 sm:space-x-4 text-gray-400 overflow-x-auto">
          <div className="flex items-center whitespace-nowrap">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-500" />
            <span className="hidden sm:inline">Ready</span>
            <span className="sm:hidden">✓</span>
          </div>
          <div className="flex items-center whitespace-nowrap">
            <Cpu className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">
              CPU: {Math.floor(Math.random() * 30) + 10}%
            </span>
            <span className="sm:hidden">
              {Math.floor(Math.random() * 30) + 10}%
            </span>
          </div>
          <div className="flex items-center whitespace-nowrap">
            <HardDrive className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">
              Memory: {Math.floor(Math.random() * 40) + 20}%
            </span>
            <span className="sm:hidden">
              {Math.floor(Math.random() * 40) + 20}%
            </span>
          </div>
          <div className="flex items-center whitespace-nowrap">
            <Folder className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Repls: {repls.length}</span>
            <span className="sm:hidden">{repls.length}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 text-gray-400">
          <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
          <span className="hidden sm:inline">Connected</span>
          <span className="sm:hidden">✓</span>
        </div>
      </div>

      {/* Global click handler to maintain focus */}
      <div
        className="fixed inset-0 pointer-events-none"
        onClick={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      />
    </div>
  );
};

export default TerminalInterface;
