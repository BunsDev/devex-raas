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

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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
      await commandExecutor.executeCommand(commandLine, executionContext);
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
    if (e.key === "Enter") {
      const commandLine = input;
      executeCommand(commandLine);
      setCommandHistory((prev) => [...prev, commandLine]);
      setInput("");
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

  // Calculate suggestion box position to ensure visibility
  const calculateSuggestionPosition = () => {
    if (!inputRef.current || !suggestionsRef.current) return {};

    const inputRect = inputRef.current.getBoundingClientRect();
    const suggestionRect = suggestionsRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Check if suggestions would go below viewport
    const spaceBelow = viewportHeight - inputRect.bottom;
    const suggestionHeight = suggestionRect.height || 200; // estimated height

    if (spaceBelow < suggestionHeight + 20) {
      // Show suggestions above input if not enough space below
      return {
        bottom: "100%",
        marginBottom: "8px",
        top: "auto",
      };
    }

    return {
      top: "100%",
      marginTop: "8px",
      bottom: "auto",
    };
  };

  return (
    <div className="bg-gray-900 text-green-400 font-mono overflow-hidden flex flex-col h-full">
      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600"
        onClick={() => inputRef.current?.focus()}
      >
        {/* History */}
        {history.map((entry, index) => (
          <div key={index} className={`mb-2 ${getTypeColor(entry.type)}`}>
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {entry.content}
            </pre>
            {entry.timestamp && (
              <div className="text-xs text-gray-500 mt-1">
                [{entry.timestamp}]
              </div>
            )}
          </div>
        ))}

        {/* Input Line */}
        <div className="flex items-center mt-4 relative">
          <span className="text-emerald-400 mr-2 whitespace-nowrap">
            ┌─ {userName}@devX ~
          </span>
        </div>
        <div className="flex items-center relative">
          <span className="text-emerald-400 mr-2">└─$</span>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-green-400 font-mono w-full"
              autoFocus
              autoComplete="off"
              spellCheck="false"
            />

            {/* Blinking Cursor */}
            <div
              ref={caretRef}
              className={`absolute top-0 w-2 h-5 bg-green-400 ${
                isTyping ? "opacity-100" : "opacity-0"
              } transition-opacity duration-100`}
              style={{
                left: `${input.length * 0.6}em`,
              }}
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute left-0 z-50 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto min-w-64"
                style={calculateSuggestionPosition()}
              >
                <div className="px-3 py-2 bg-gray-700 border-b border-gray-600">
                  <span className="text-xs text-gray-400 font-semibold">
                    {suggestionLabel}
                  </span>
                </div>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-green-400 text-sm flex items-center transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <span className="text-gray-500 mr-2">▸</span>
                    {suggestion}
                  </div>
                ))}
                <div className="px-3 py-1 bg-gray-750 border-t border-gray-600">
                  <span className="text-xs text-gray-500">
                    ↹ Tab to complete • ↑↓ Navigate • Esc to close
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0  bg-gray-800 px-4 py-2 border-t border-gray-700 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4 text-gray-400">
          <div className="flex items-center">
            <Activity className="w-4 h-4 mr-1 text-green-500" />
            <span>Ready</span>
          </div>
          <div className="flex items-center">
            <Cpu className="w-4 h-4 mr-1" />
            <span>CPU: {Math.floor(Math.random() * 30) + 10}%</span>
          </div>
          <div className="flex items-center">
            <HardDrive className="w-4 h-4 mr-1" />
            <span>Memory: {Math.floor(Math.random() * 40) + 20}%</span>
          </div>
          <div className="flex items-center">
            <Folder className="w-4 h-4 mr-1" />
            <span>Repls: {repls.length}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-gray-400">
          <Wifi className="w-4 h-4 text-green-500" />
          <span>Connected</span>
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
