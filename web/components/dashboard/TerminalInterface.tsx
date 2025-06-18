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
  StoredRepl,
} from "@/types/dashboard";

const templates = {
  "node-js": {
    key: "templates/node-js",
    name: "Node-JS",
  },
  python: {
    key: "templates/python",
    name: "Python",
  },
};

const generateCmds = (
  userName: string,
  getRepls: () => Promise<StoredRepl[]>,
  createRepl: (templateKey: string, replName: string) => Promise<void>,
  startRepl: (replId: string) => Promise<void>,
  deleteRepl: (replId: string) => Promise<void>,
): Commands => {
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
      execute: async (args, context) => {
        const uptime = Math.floor(Math.random() * 72) + 1;
        const repls = await getRepls();
        return `╭─────────────────────────────────────────╮
│             SYSTEM STATUS               │
╰─────────────────────────────────────────╯
🟢 System:     Online
🔋 CPU:        ${Math.floor(Math.random() * 30) + 10}%
💾 Memory:     ${Math.floor(Math.random() * 40) + 20}%
💿 Storage:    ${Math.floor(Math.random() * 60) + 15}%
⏱️ Uptime:     ${uptime}h ${Math.floor(Math.random() * 60)}m
📊 Repls:      ${repls.length} active`;
      },
    },

    templates: {
      description: "Show available templates",
      usage: "templates",
      execute: () => {
        const templateList = Object.entries(templates)
          .map(([key, template]) => `  ${key.padEnd(12)} - ${template.name}`)
          .join("\n");
        return `╭─────────────────────────────────────────╮
│           AVAILABLE TEMPLATES           │
╰─────────────────────────────────────────╯
${templateList}

Use these template names with create-repl command.`;
      },
    },

    "create-repl": {
      description: "Create a new repl",
      usage: "create-repl <name> <template>",
      execute: async (args, context) => {
        if (args.length < 2) {
          const templateList = Object.keys(templates).join(", ");
          return `❌ Error: Both name and template are required
Usage: create-repl <name> <template>
Available templates: ${templateList}
Use 'templates' command to see all available templates.`;
        }

        const [name, templateKey] = args;

        // Validate template
        if (!templates[templateKey as keyof typeof templates]) {
          const templateList = Object.keys(templates).join(", ");
          return `❌ Error: Invalid template "${templateKey}"
Available templates: ${templateList}
Use 'templates' command to see all available templates.`;
        }

        try {
          const template = templates[templateKey as keyof typeof templates];
          await createRepl(template.key, name);
          return `✅ Successfully created repl "${name}"
   Template: ${template.name}
   Key: ${template.key}
   Status: Ready`;
        } catch (error: any) {
          return `❌ Error creating repl: ${error.message || "Unknown error"}`;
        }
      },
    },

    "list-repls": {
      description: "List all repls",
      usage: "list-repls [--detailed]",
      execute: async (args, context) => {
        try {
          const repls = await getRepls();

          if (repls.length === 0) {
            return '📭 No repls found.\nUse "create-repl <name> <template>" to create one.';
          }

          const detailed = args.includes("--detailed");
          if (detailed) {
            const header = `╭─────────────────────────────────────────╮
│               REPL DETAILS              │
╰─────────────────────────────────────────╯`;
            const replList = repls
              .map(
                (repl) =>
                  `📁 ${repl.name} (ID: ${repl.id})
   👤 User: ${repl.user}
   ⚡ Status: Active`,
              )
              .join("\n\n");
            return `${header}\n${replList}`;
          }

          const header = `╭─────────────────────────────────────────╮
│               ACTIVE REPLS              │
╰─────────────────────────────────────────╯`;
          return `${header}\n${repls.map((repl, i) => `${i + 1}. 📁 ${repl.name} (${repl.id})`).join("\n")}`;
        } catch (error: any) {
          return `❌ Error fetching repls: ${error.message || "Unknown error"}`;
        }
      },
    },

    "search-repls": {
      description: "Search repls by name",
      usage: "search-repls <query>",
      execute: async (args, context) => {
        if (args.length === 0) {
          return "❌ Error: Search query is required\nUsage: search-repls <query>";
        }

        try {
          const query = args.join(" ").toLowerCase();
          const repls = await getRepls();
          const matches = repls.filter((repl) =>
            repl.name.toLowerCase().includes(query),
          );

          if (matches.length === 0) {
            return `🔍 No repls found matching "${query}"`;
          }

          const header = `╭─────────────────────────────────────────╮
│             SEARCH RESULTS              │
╰─────────────────────────────────────────╯`;
          return `${header}\n🔍 Found ${matches.length} repl(s) matching "${query}":\n${matches.map((repl, i) => `${i + 1}. 📁 ${repl.name} (${repl.id})`).join("\n")}`;
        } catch (error: any) {
          return `❌ Error searching repls: ${error.message || "Unknown error"}`;
        }
      },
    },

    "start-repl": {
      description: "Start a repl by name",
      usage: "start-repl <repl-name>",
      execute: async (args, context) => {
        if (args.length === 0) {
          return "❌ Error: Repl name is required\nUsage: start-repl <repl-name>";
        }

        const replName = args[0].toLowerCase();

        try {
          const repls = await getRepls();
          const repl = repls.find((r) => r.name.toLowerCase() === replName);

          if (!repl) {
            return `❌ Error: Repl with name "${replName}" not found. Use 'list-repls' to see available repls.`;
          }

          await startRepl(repl.id);
          return `🚀 Successfully started repl "${repl.name}"`;
        } catch (error: any) {
          return `❌ Error starting repl: ${error.message || "Unknown error"}`;
        }
      },
    },

    "delete-repl": {
      description: "Delete a repl by name",
      usage: "delete-repl <repl-name>",
      execute: async (args, context) => {
        if (args.length === 0) {
          return "❌ Error: Repl name is required\nUsage: delete-repl <repl-name>";
        }

        const replName = args[0].toLowerCase();

        try {
          const repls = await getRepls();
          const repl = repls.find((r) => r.name.toLowerCase() === replName);

          if (!repl) {
            return `❌ Error: Repl with name "${replName}" not found. Use 'list-repls' to see available repls.`;
          }

          await deleteRepl(repl.id);
          return `🗑️ Successfully deleted repl "${repl.name}"`;
        } catch (error: any) {
          return `❌ Error deleting repl: ${error.message || "Unknown error"}`;
        }
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

  ██████╗ ███████╗██╗   ██╗██╗  ██╗            ██████╗██╗      ██████╗ ██╗   ██╗██████╗     ██╗██████╗ ███████╗
  ██╔══██╗██╔════╝██║   ██║╚██╗██╔╝    ██╗    ██╔════╝██║     ██╔═══██╗██║   ██║██╔══██╗    ██║██╔══██╗██╔════╝
  ██║  ██║█████╗  ██║   ██║ ╚███╔╝     ╚═╝    ██║     ██║     ██║   ██║██║   ██║██║  ██║    ██║██║  ██║█████╗
  ██║  ██║██╔══╝  ╚██╗ ██╔╝ ██╔██╗     ██╗    ██║     ██║     ██║   ██║██║   ██║██║  ██║    ██║██║  ██║██╔══╝
  ██████╔╝███████╗ ╚████╔╝ ██╔╝ ██╗    ╚═╝    ╚██████╗███████╗╚██████╔╝╚██████╔╝██████╔╝    ██║██████╔╝███████╗
  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝  ╚═╝            ╚═════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝     ╚═╝╚═════╝ ╚══════╝

`;

// Terminal Interface Component
const TerminalInterface = ({
  userName,
  getRepls,
  createRepl,
  startRepl,
  deleteRepl,
}: {
  userName: string;
  getRepls: () => Promise<StoredRepl[]>;
  createRepl: (templateKey: string, replName: string) => Promise<void>;
  startRepl: (replId: string) => Promise<void>;
  deleteRepl: (replId: string) => Promise<void>;
}) => {
  const COMMANDS = generateCmds(
    userName,
    getRepls,
    createRepl,
    startRepl,
    deleteRepl,
  );
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
        '💡 Type "help" to see available commands or "templates" to see available templates',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [repls, setRepls] = useState<Repl[]>([]);

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

  // Enhanced suggestion logic for templates and commands
  const getSuggestions = (currentInput: string): string[] => {
    const parts = currentInput.trim().split(" ");
    const command = parts[0];
    const args = parts.slice(1);

    // Command suggestions
    if (parts.length === 1) {
      return Object.keys(COMMANDS).filter((cmd) =>
        cmd.startsWith(command.toLowerCase()),
      );
    }

    // Template suggestions for create-repl command
    if (command === "create-repl" && args.length === 2) {
      const templateQuery = args[1].toLowerCase();
      return Object.keys(templates).filter((template) =>
        template.startsWith(templateQuery),
      );
    }

    // Repl Name suggestions
    if (
      (command === "start-repl" || command === "delete-repl") &&
      args.length === 1
    ) {
      const replNameQuery = args[0].toLowerCase();
      return repls
        .filter((repl) => repl.name.toLowerCase().startsWith(replNameQuery))
        .map((repl) => repl.name);
    }

    return [];
  };

  const executeCommand = useCallback(
    async (commandLine: string): Promise<void> => {
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
          const result = await COMMANDS[command].execute(args, context);
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
    [repls, setRepls, COMMANDS, userName],
  );

  const handleInputChange = (value: string): void => {
    setInput(value);

    // Update suggestions based on current input
    const suggestions = getSuggestions(value);
    setSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0 && value.trim().length > 0);
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
      const currentSuggestions = getSuggestions(input);

      if (currentSuggestions.length === 1) {
        const parts = input.trim().split(" ");
        if (parts.length === 1) {
          // Complete command
          setInput(currentSuggestions[0] + " ");
        } else if (parts[0] === "create-repl" && parts.length === 3) {
          // Complete template
          const newCommand = `${parts[0]} ${parts[1]} ${currentSuggestions[0]} `;
          setInput(newCommand);
        }
      } else if (currentSuggestions.length > 1) {
        setSuggestions(currentSuggestions);
        setShowSuggestions(true);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string): void => {
    const parts = input.trim().split(" ");
    const command = parts[0];

    if (parts.length === 1) {
      // Complete command
      setInput(suggestion + " ");
    } else if (command === "create-repl" && parts.length === 3) {
      // Complete template for create-repl
      const newCommand = `${parts[0]} ${parts[1]} ${suggestion} `;
      setInput(newCommand);
    } else if (
      (command === "start-repl" || command === "delete-repl") &&
      parts.length === 2
    ) {
      // Complete repl name for start-repl or delete-repl
      const newCommand = `${parts[0]} ${suggestion} `;
      setInput(newCommand);
    }

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
              handleInputChange(e.target.value)
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

      {/* Enhanced Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-3 p-3 bg-gray-900 border border-gray-700 rounded-lg">
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Search className="w-3 h-3" />
            {input.includes("create-repl") && input.split(" ").length === 3
              ? "Available Templates:"
              : (input.includes("start-repl") ||
                    input.includes("delete-repl")) &&
                  input.split(" ").length === 2
                ? "Available Repls:"
                : "Tab Completions:"}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-sm text-emerald-400 cursor-pointer hover:bg-gray-800 px-2 py-1 rounded transition-colors flex items-center gap-2"
              >
                {input.includes("create-repl") &&
                templates[suggestion as keyof typeof templates] ? (
                  <>
                    <Code className="w-3 h-3" />
                    <span>{suggestion}</span>
                    <span className="text-xs text-gray-500">
                      ({templates[suggestion as keyof typeof templates].name})
                    </span>
                  </>
                ) : (input.includes("start-repl") ||
                    input.includes("delete-repl")) &&
                  repls.find((r) => r.name === suggestion) ? (
                  <>
                    <Folder className="w-3 h-3" />
                    <span>{suggestion}</span>
                  </>
                ) : (
                  suggestion
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminalInterface;
