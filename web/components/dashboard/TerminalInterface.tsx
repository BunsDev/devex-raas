"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Terminal,
  Code,
  Folder,
  Trash2,
  Plus,
  Search,
  Zap,
  Activity,
  Server,
  GitBranch,
  Clock,
  User,
  Settings,
  Power,
  Cpu,
  HardDrive,
  Wifi,
} from "lucide-react";

import {
  Commands,
  Repl,
  HistoryEntry,
  CommandContext,
} from "@/types/dashboard";

const generateCmds = (userName: string): Commands => {
  const COMMANDS: Commands = {
    help: {
      description: "Show available commands",
      usage: "help",
      execute: () => {
        const commands = Object.keys(COMMANDS)
          .map((cmd) => `  ${cmd.padEnd(12)} - ${COMMANDS[cmd].description}`)
          .join("\n");
        return `╭─────────────────────────────────────────╮
│             AVAILABLE COMMANDS          │
╰─────────────────────────────────────────╯
${commands}

Type <command> --help for detailed usage information.`;
      },
    },

    version: {
      description: "Show application version",
      usage: "version",
      execute: () => `╭─────────────────────────────────────────╮
│             SYSTEM INFO                 │
╰─────────────────────────────────────────╯
devX v2.0.0 - Next-Gen Terminal Interface
Built with React & TypeScript
Status: Online ✓`,
    },

    status: {
      description: "Show system status",
      usage: "status",
      execute: (args, context) => {
        const uptime = Math.floor(Math.random() * 72) + 1;
        return `╭─────────────────────────────────────────╮
│             SYSTEM STATUS               │
╰─────────────────────────────────────────╯
🟢 System:     Online
🔋 CPU:        ${Math.floor(Math.random() * 30) + 10}%
💾 Memory:     ${Math.floor(Math.random() * 40) + 20}%
💿 Storage:    ${Math.floor(Math.random() * 60) + 15}%
⏱️ Uptime:     ${uptime}h ${Math.floor(Math.random() * 60)}m
📊 Repls:      ${context.repls.length} active`;
      },
    },

    "create-repl": {
      description: "Create a new repl",
      usage: "create-repl <name> [template]",
      execute: (args, context) => {
        if (args.length === 0) {
          return "❌ Error: Repl name is required\nUsage: create-repl <name> [template]";
        }
        const name = args[0];
        const template = args[1] || "blank";
        const newRepl: Repl = {
          id: Date.now().toString(),
          name,
          template,
          createdAt: new Date().toISOString(),
        };
        context.setRepls((prev) => [...prev, newRepl]);
        return `✅ Successfully created repl "${name}"
   Template: ${template}
   ID: ${newRepl.id}
   Status: Ready`;
      },
    },

    "list-repls": {
      description: "List all repls",
      usage: "list-repls [--detailed]",
      execute: (args, context) => {
        const { repls } = context;
        if (repls.length === 0) {
          return '📭 No repls found.\nUse "create-repl <name>" to create one.';
        }

        const detailed = args.includes("--detailed");
        if (detailed) {
          const header = `╭─────────────────────────────────────────╮
│               REPL DETAILS              │
╰─────────────────────────────────────────╯`;
          const replList = repls
            .map(
              (repl) =>
                `📁 ${repl.name} (${repl.id})
   🏷️ Template: ${repl.template}
   🕒 Created: ${new Date(repl.createdAt).toLocaleString()}
   ⚡ Status: Active`,
            )
            .join("\n\n");
          return `${header}\n${replList}`;
        }

        const header = `╭─────────────────────────────────────────╮
│               ACTIVE REPLS              │
╰─────────────────────────────────────────╯`;
        return `${header}\n${repls.map((repl, i) => `${i + 1}. 📁 ${repl.name} (${repl.template})`).join("\n")}`;
      },
    },

    "search-repls": {
      description: "Search repls by name",
      usage: "search-repls <query>",
      execute: (args, context) => {
        if (args.length === 0) {
          return "❌ Error: Search query is required\nUsage: search-repls <query>";
        }
        const query = args.join(" ").toLowerCase();
        const matches = context.repls.filter((repl) =>
          repl.name.toLowerCase().includes(query),
        );

        if (matches.length === 0) {
          return `🔍 No repls found matching "${query}"`;
        }

        const header = `╭─────────────────────────────────────────╮
│             SEARCH RESULTS              │
╰─────────────────────────────────────────╯`;
        return `${header}\n🔍 Found ${matches.length} repl(s) matching "${query}":\n${matches.map((repl, i) => `${i + 1}. 📁 ${repl.name} (${repl.template})`).join("\n")}`;
      },
    },

    "delete-repl": {
      description: "Delete a repl by name",
      usage: "delete-repl <name>",
      execute: (args, context) => {
        if (args.length === 0) {
          return "❌ Error: Repl name is required\nUsage: delete-repl <name>";
        }
        const name = args[0];
        const replIndex = context.repls.findIndex((repl) => repl.name === name);

        if (replIndex === -1) {
          return `❌ Error: Repl "${name}" not found`;
        }

        context.setRepls((prev) =>
          prev.filter((_, index) => index !== replIndex),
        );
        return `🗑️ Successfully deleted repl "${name}"`;
      },
    },

    clear: {
      description: "Clear the terminal",
      usage: "clear",
      execute: (args, context) => {
        context.setHistory([
          {
            type: "info",
            content: "🚀 devX Terminal v2.0.0 - Ready for commands",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        return "";
      },
    },

    whoami: {
      description: "Display current user information",
      usage: "whoami",
      execute: () => {
        return `╭─────────────────────────────────────────╮
│              USER PROFILE               │
╰─────────────────────────────────────────╯
👤 User:       ${userName}
🏠 Home:       /home/${userName}
🐚 Shell:      devX Terminal v2.0.0
🌐 Session:    ${new Date().toLocaleString()}`;
      },
    },

    ls: {
      description: "Alias for list-repls",
      usage: "ls [--detailed]",
      execute: (args, context) => COMMANDS["list-repls"].execute(args, context),
    },

    neofetch: {
      description: "Display system information",
      usage: "neofetch",
      execute: () => {
        return `                    ╭───────────────────────╮
    ╭─────────────╮   │     devX v2.0.0       │
    │  ████████   │   │                           │
    │  ████████   │   │ OS: devX Terminal     │
    │  ████████   │   │ Shell: Advanced CLI       │
    │  ████████   │   │ Theme: Dark Terminal      │
    ╰─────────────╯   │ Uptime: Online            │
                    ╰───────────────────────╯`;
      },
    },
  };

  return COMMANDS;
};

// ASCII Art Banner
const ASCII_BANNER = `

  ██████╗ ███████╗██╗   ██╗██╗  ██╗        ██████╗██╗      ██████╗ ██╗   ██╗██████╗     ██╗██████╗ ███████╗
  ██╔══██╗██╔════╝██║   ██║╚██╗██╔╝██╗    ██╔════╝██║     ██╔═══██╗██║   ██║██╔══██╗    ██║██╔══██╗██╔════╝
  ██║  ██║█████╗  ██║   ██║ ╚███╔╝ ╚═╝    ██║     ██║     ██║   ██║██║   ██║██║  ██║    ██║██║  ██║█████╗
  ██║  ██║██╔══╝  ╚██╗ ██╔╝ ██╔██╗ ██╗    ██║     ██║     ██║   ██║██║   ██║██║  ██║    ██║██║  ██║██╔══╝
  ██████╔╝███████╗ ╚████╔╝ ██╔╝ ██╗╚═╝    ╚██████╗███████╗╚██████╔╝╚██████╔╝██████╔╝    ██║██████╔╝███████╗
  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝  ╚═╝        ╚═════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝     ╚═╝╚═════╝ ╚══════╝

`;

// Terminal Interface Component
const TerminalInterface = ({ userName }: { userName: string }) => {
  const COMMANDS = generateCmds(userName);
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
        '💡 Type "help" to see available commands or "neofetch" for system info',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [repls, setRepls] = useState<Repl[]>([
    {
      id: "1",
      name: "my-react-app",
      template: "react",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "backend-api",
      template: "nodejs",
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "ml-playground",
      template: "python",
      createdAt: new Date().toISOString(),
    },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((): void => {
    if (terminalRef.current) {
      setTimeout(() => {
        terminalRef.current!.scrollTop = terminalRef.current!.scrollHeight;
      }, 50);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, scrollToBottom]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTyping((prev) => !prev);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const executeCommand = useCallback(
    (commandLine: string): void => {
      const trimmed = commandLine.trim();
      if (!trimmed) return;

      const [command, ...args] = trimmed.split(" ");
      const context: CommandContext = { repls, setRepls, setHistory };
      const timestamp = new Date().toLocaleTimeString();

      // Check for help flags
      if (args.includes("-h") || args.includes("--help")) {
        const cmd = COMMANDS[command];
        if (cmd) {
          const helpText = `╭─────────────────────────────────────────╮
│               COMMAND HELP              │
╰─────────────────────────────────────────╯
📖 ${cmd.description}
💻 Usage: ${cmd.usage}`;
          setHistory((prev) => [
            ...prev,
            {
              type: "command",
              content: `┌─ ${userName}@devX ~
└─$ ${commandLine}`,
              timestamp,
            },
            { type: "output", content: helpText, timestamp },
          ]);
          return;
        }
      }

      // Execute command
      if (COMMANDS[command]) {
        try {
          const result = COMMANDS[command].execute(args, context);
          if (result) {
            setHistory((prev) => [
              ...prev,
              {
                type: "command",
                content: `┌─ ${userName}@devX ~
└─$ ${commandLine}`,
                timestamp,
              },
              { type: "output", content: result, timestamp },
            ]);
          } else if (command !== "clear") {
            setHistory((prev) => [
              ...prev,
              {
                type: "command",
                content: `┌─ ${userName}@devX ~
└─$ ${commandLine}`,
                timestamp,
              },
            ]);
          }
        } catch (error: any) {
          setHistory((prev) => [
            ...prev,
            {
              type: "command",
              content: `┌─ ${userName}@devX ~
└─$ ${commandLine}`,
              timestamp,
            },
            { type: "error", content: `💥 Error: ${error.message}`, timestamp },
          ]);
        }
      } else {
        setHistory((prev) => [
          ...prev,
          {
            type: "command",
            content: `┌─ ${userName}@devX ~
└─$ ${commandLine}`,
            timestamp,
          },
          {
            type: "error",
            content: `❌ Command not found: '${command}'\n💡 Type "help" to see available commands.`,
            timestamp,
          },
        ]);
      }
    },
    [repls, setRepls],
  );

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
      const currentInput = input.trim();
      const suggestions = Object.keys(COMMANDS).filter((cmd) =>
        cmd.startsWith(currentInput),
      );

      if (suggestions.length === 1) {
        setInput(suggestions[0] + " ");
      } else if (suggestions.length > 1) {
        setSuggestions(suggestions);
        setShowSuggestions(true);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string): void => {
    setInput(suggestion + " ");
    setShowSuggestions(false);
    inputRef.current?.focus();
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Update caret position on input change
  useEffect(() => {
    if (inputRef.current && caretRef.current) {
      const charWidth =
        parseFloat(getComputedStyle(inputRef.current).fontSize) * 0.6;
      const caretLeft = input.length * charWidth;

      caretRef.current.style.left = `${caretLeft}px`;
    }
  }, [input]);

  return (
    <div
      ref={terminalRef}
      className="flex-1 p-4 font-mono text-sm overflow-y-auto bg-black"
      style={{ height: "calc(100% - 70px)" }}
    >
      {history.map((entry, index) => (
        <div
          key={index}
          className={`mb-2 leading-relaxed ${getTypeColor(entry.type)}`}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <pre className="whitespace-pre-wrap font-mono">
                {entry.content}
              </pre>
            </div>
            {entry.timestamp && (
              <span className="text-xs text-gray-600 mt-1 shrink-0">
                {entry.timestamp}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Command Input */}
      <div
        className="flex items-center gap-2 mt-4"
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-emerald-400 font-bold">
          ┌─ ${userName}@devX ~
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-emerald-400 font-bold">└─$</span>
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            id="terminal-input-div"
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            autoFocus
            className="flex-grow bg-transparent text-gray-200 text-sm outline-none border-none p-0 m-0 caret-transparent w-full font-mono"
          />
          {/* Custom Block Caret */}
          <div
            ref={caretRef}
            className={`absolute right-0 top-0 text-emerald-400 ${isTyping ? "opacity-100" : "opacity-0"} transition-opacity`}
          >
            ▋
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-3 p-3 bg-gray-900 border border-gray-700 rounded-lg">
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Search className="w-3 h-3" />
            Tab Completions:
          </div>
          <div className="grid grid-cols-2 gap-1">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-sm text-emerald-400 cursor-pointer hover:bg-gray-800 px-2 py-1 rounded transition-colors"
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}> = ({ icon, title, value, subtitle, color }) => (
  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-emerald-500 transition-all duration-300 group">
    <div className="flex items-center gap-3">
      <div
        className={`p-2 rounded-lg ${color} group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-200">{value}</div>
        <div className="text-sm text-gray-400">{subtitle}</div>
      </div>
    </div>
  </div>
);

// System Monitor Component
const SystemMonitor: React.FC = () => {
  const [stats, setStats] = useState({
    cpu: 23,
    memory: 67,
    network: 45,
    uptime: "2d 14h 32m",
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        cpu: Math.floor(Math.random() * 40) + 10,
        memory: Math.floor(Math.random() * 30) + 40,
        network: Math.floor(Math.random() * 60) + 20,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Server className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-gray-200">System Monitor</h3>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">CPU Usage</span>
            <span className="text-gray-300">{stats.cpu}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${stats.cpu}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Memory</span>
            <span className="text-gray-300">{stats.memory}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${stats.memory}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Network I/O</span>
            <span className="text-gray-300">{stats.network}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${stats.network}%` }}
            ></div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Uptime</span>
            <span className="text-gray-300">{stats.uptime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalInterface;
