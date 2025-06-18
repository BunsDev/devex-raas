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
      description: "Show available commands and getting started guide",
      usage: "help",
      execute: () => {
        const commands = Object.keys(COMMANDS)
          .map((cmd) => `  ${cmd.padEnd(12)} - ${COMMANDS[cmd].description}`)
          .join("\n");
        return `╭─────────────────────────────────────────╮
│             AVAILABLE COMMANDS          │
╰─────────────────────────────────────────╯
${commands}

╭─────────────────────────────────────────╮
│             GETTING STARTED             │
╰─────────────────────────────────────────╯
🚀 Quick Start Guide:
1. Create a new repl: repl create <name> <template>
2. Start your repl: repl start <name>
3. List all repls: repl list

💡 Example workflow:
   repl create my-app node-js
   repl start my-app

Type <command> --help for detailed usage information.`;
      },
    },

    version: {
      description: "Show application version and system information",
      usage: "version",
      execute: () => `╭─────────────────────────────────────────╮
│             SYSTEM INFO                 │
╰─────────────────────────────────────────╯
devX v2.0.0 - Next-Gen Terminal Interface
Built with React & TypeScript
Status: Online ✓`,
    },

    status: {
      description: "Display comprehensive system status and metrics",
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
📊 Repls:      ${repls.length} active

💡 Use 'repl list' to see all your repls`;
      },
    },

    templates: {
      description: "Show available templates for creating new repls",
      usage: "templates",
      execute: () => {
        const templateList = Object.entries(templates)
          .map(([key, template]) => `  ${key.padEnd(12)} - ${template.name}`)
          .join("\n");
        return `╭─────────────────────────────────────────╮
│           AVAILABLE TEMPLATES           │
╰─────────────────────────────────────────╯
${templateList}

💡 Usage: repl create <name> <template>
   Example: repl create my-app node-js`;
      },
    },

    repl: {
      description: "Manage repls - create, start, delete, and list repls",
      usage: "repl <subcommand> [options]",
      execute: async (args, context) => {
        if (args.length === 0) {
          return `╭─────────────────────────────────────────╮
│               REPL MANAGER              │
╰─────────────────────────────────────────╯
Available subcommands:
  create <name> <template>  - Create a new repl
  start <name>             - Start an existing repl
  delete <name>            - Delete a repl
  list [--detailed]        - List all repls
  search <query>           - Search repls by name

💡 Examples:
   repl create my-app node-js
   repl start my-app
   repl delete old-project
   repl list --detailed

Use 'templates' to see available templates.`;
        }

        const [subcommand, ...subArgs] = args;

        switch (subcommand) {
          case "create":
            return await handleReplCreate(subArgs, context);
          case "start":
            return await handleReplStart(subArgs, context);
          case "delete":
            return await handleReplDelete(subArgs, context);
          case "list":
            return await handleReplList(subArgs, context);
          case "search":
            return await handleReplSearch(subArgs, context);
          default:
            return `❌ Unknown repl subcommand: ${subcommand}
Available subcommands: create, start, delete, list, search
Use 'repl --help' for more information.`;
        }
      },
    },

    clear: {
      description: "Clear the terminal screen and reset history",
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
      description: "Display current user information and session details",
      usage: "whoami",
      execute: () => {
        return `╭─────────────────────────────────────────╮
│              USER PROFILE               │
╰─────────────────────────────────────────╯
👤 User:       ${userName}
🏠 Home:       /home/${userName}
🐚 Shell:      devX Terminal v2.0.0
🌐 Session:    ${new Date().toLocaleString()}

💡 Try 'repl create <name> <template>' to get started!`;
      },
    },

    ls: {
      description: "List all repls (alias for 'repl list')",
      usage: "ls [--detailed]",
      execute: (args, context) => handleReplList(args, context),
    },

    neofetch: {
      description: "Display system information in a stylized format",
      usage: "neofetch",
      execute: () => {
        return `                    ╭───────────────────────╮
    ╭─────────────╮   │     devX v2.0.0       │
    │  ████████   │   │                           │
    │  ████████   │   │ OS: devX Terminal     │
    │  ████████   │   │ Shell: Advanced CLI       │
    │  ████████   │   │ Theme: Dark Terminal      │
    ╰─────────────╯   │ Uptime: Online            │
                    ╰───────────────────────╯

💡 Ready to code! Try 'repl create <name> <template>'`;
      },
    },
  };

  // Repl subcommand handlers
  async function handleReplCreate(args: string[], context: CommandContext) {
    if (args.length < 2) {
      const templateList = Object.keys(templates).join(", ");
      return `❌ Error: Both name and template are required
Usage: repl create <name> <template>
Available templates: ${templateList}

💡 Use 'templates' command to see all available templates.
   Example: repl create my-app node-js`;
    }

    const [name, templateKey] = args;

    // Validate template
    if (!templates[templateKey as keyof typeof templates]) {
      const templateList = Object.keys(templates).join(", ");
      return `❌ Error: Invalid template "${templateKey}"
Available templates: ${templateList}

💡 Use 'templates' command to see all available templates.`;
    }

    try {
      const template = templates[templateKey as keyof typeof templates];
      await createRepl(template.key, name);
      return `✅ Successfully created repl "${name}"
   Template: ${template.name}
   Key: ${template.key}
   Status: Ready

🚀 Next step: Start your repl with 'repl start ${name}'`;
    } catch (error: any) {
      return `❌ Error creating repl: ${error.message || "Unknown error"}`;
    }
  }

  async function handleReplStart(args: string[], context: CommandContext) {
    if (args.length === 0) {
      return `❌ Error: Repl name is required
Usage: repl start <repl-name>

💡 Use 'repl list' to see available repls.`;
    }

    const replName = args[0].toLowerCase();

    try {
      const repls = await getRepls();
      const repl = repls.find((r) => r.name.toLowerCase() === replName);

      if (!repl) {
        const availableRepls = repls.map((r) => r.name).join(", ");
        return `❌ Error: Repl with name "${replName}" not found.
${repls.length > 0 ? `Available repls: ${availableRepls}` : "No repls found."}

💡 Use 'repl list' to see all repls or 'repl create <name> <template>' to create one.`;
      }

      await startRepl(repl.id);
      return `🚀 Successfully started repl "${repl.name}"
   Status: Running
   ID: ${repl.id}`;
    } catch (error: any) {
      return `❌ Error starting repl: ${error.message || "Unknown error"}`;
    }
  }

  async function handleReplDelete(args: string[], context: CommandContext) {
    if (args.length === 0) {
      return `❌ Error: Repl name is required
Usage: repl delete <repl-name>

💡 Use 'repl list' to see available repls.
⚠️  Warning: This action cannot be undone.`;
    }

    const replName = args[0].toLowerCase();

    try {
      const repls = await getRepls();
      const repl = repls.find((r) => r.name.toLowerCase() === replName);

      if (!repl) {
        const availableRepls = repls.map((r) => r.name).join(", ");
        return `❌ Error: Repl with name "${replName}" not found.
${repls.length > 0 ? `Available repls: ${availableRepls}` : "No repls found."}

💡 Use 'repl list' to see all available repls.`;
      }

      await deleteRepl(repl.id);
      return `🗑️ Successfully deleted repl "${repl.name}"
   ID: ${repl.id}

💡 Use 'repl create <name> <template>' to create a new repl.`;
    } catch (error: any) {
      return `❌ Error deleting repl: ${error.message || "Unknown error"}`;
    }
  }

  async function handleReplList(args: string[], context: CommandContext) {
    try {
      const repls = await getRepls();

      if (repls.length === 0) {
        return `📭 No repls found.

🚀 Get started by creating your first repl:
   repl create my-app node-js
   repl start my-app

💡 Use 'templates' to see available templates.`;
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
   ⚡ Status: Active
   🚀 Start: repl start ${repl.name}`,
          )
          .join("\n\n");
        return `${header}\n${replList}

💡 Use 'repl start <name>' to start any repl.`;
      }

      const header = `╭─────────────────────────────────────────╮
│               ACTIVE REPLS              │
╰─────────────────────────────────────────╯`;
      return `${header}\n${repls.map((repl, i) => `${i + 1}. 📁 ${repl.name} (${repl.id})`).join("\n")}

💡 Use 'repl start <name>' to start a repl or 'repl list --detailed' for more info.`;
    } catch (error: any) {
      return `❌ Error fetching repls: ${error.message || "Unknown error"}`;
    }
  }

  async function handleReplSearch(args: string[], context: CommandContext) {
    if (args.length === 0) {
      return `❌ Error: Search query is required
Usage: repl search <query>

💡 Example: repl search my-app`;
    }

    try {
      const query = args.join(" ").toLowerCase();
      const repls = await getRepls();
      const matches = repls.filter((repl) =>
        repl.name.toLowerCase().includes(query),
      );

      if (matches.length === 0) {
        return `🔍 No repls found matching "${query}"

💡 Use 'repl list' to see all repls or 'repl create <name> <template>' to create one.`;
      }

      const header = `╭─────────────────────────────────────────╮
│             SEARCH RESULTS              │
╰─────────────────────────────────────────╯`;
      return `${header}\n🔍 Found ${matches.length} repl(s) matching "${query}":\n${matches.map((repl, i) => `${i + 1}. 📁 ${repl.name} (${repl.id})`).join("\n")}

💡 Use 'repl start <name>' to start any of these repls.`;
    } catch (error: any) {
      return `❌ Error searching repls: ${error.message || "Unknown error"}`;
    }
  }

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
        '💡 Type "help" to see available commands or "repl create <name> <template>" to get started',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [input, setInput] = useState<string>("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
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
        setRepls(storedRepls as StoredRepl[]);
      } catch (error) {
        console.error("Failed to load repls:", error);
      }
    };
    loadRepls();
  }, [getRepls]);

  // Enhanced suggestion logic for repl subcommands
  const getSuggestions = (currentInput: string): string[] => {
    const parts = currentInput.trim().split(" ");
    const command = parts[0];
    const subcommand = parts[1];
    const args = parts.slice(2);

    // Command suggestions
    if (parts.length === 1) {
      return Object.keys(COMMANDS).filter((cmd) =>
        cmd.startsWith(command.toLowerCase()),
      );
    }

    // Repl subcommand suggestions
    if (command === "repl" && parts.length === 2) {
      const subcommands = ["create", "start", "delete", "list", "search"];
      return subcommands.filter((sub) =>
        sub.startsWith(subcommand.toLowerCase()),
      );
    }

    // Template suggestions for repl create command
    if (command === "repl" && subcommand === "create" && parts.length === 4) {
      const templateQuery = args[1].toLowerCase();
      return Object.keys(templates).filter((template) =>
        template.startsWith(templateQuery),
      );
    }

    // Repl name suggestions for repl start/delete commands
    if (
      command === "repl" &&
      (subcommand === "start" || subcommand === "delete") &&
      parts.length === 3
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
              content: `┌─ ${userName}@devX ~\n└─$ ${commandLine}`,
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
                content: `┌─ ${userName}@devX ~\n└─$ ${commandLine}`,
                timestamp,
              },
              { type: "output", content: result, timestamp },
            ]);
          } else if (command !== "clear") {
            setHistory((prev) => [
              ...prev,
              {
                type: "command",
                content: `┌─ ${userName}@devX ~\n└─$ ${commandLine}`,
                timestamp,
              },
            ]);
          }
        } catch (error: any) {
          setHistory((prev) => [
            ...prev,
            {
              type: "command",
              content: `┌─ ${userName}@devX ~\n└─$ ${commandLine}`,
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
            content: `┌─ ${userName}@devX ~\n└─$ ${commandLine}`,
            timestamp,
          },
          {
            type: "error",
            content: `❌ Command not found: '${command}'\n💡 Type "help" to see available commands.`,
            timestamp,
          },
        ]);
      }

      // Refresh repls after commands that might change them
      if (command === "repl" && ["create", "delete"].includes(args[0])) {
        try {
          const updatedRepls = await getRepls();
          setRepls(updatedRepls as StoredRepl[]);
        } catch (error) {
          console.error("Failed to refresh repls:", error);
        }
      }
    },
    [repls, setRepls, COMMANDS, userName, getRepls],
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
        } else if (parts[0] === "repl" && parts.length === 2) {
          // Complete repl subcommand
          setInput(`repl ${currentSuggestions[0]} `);
        } else if (
          parts[0] === "repl" &&
          parts[1] === "create" &&
          parts.length === 4
        ) {
          // Complete template for repl create
          const newCommand = `${parts[0]} ${parts[1]} ${parts[2]} ${currentSuggestions[0]} `;
          setInput(newCommand);
        } else if (
          parts[0] === "repl" &&
          (parts[1] === "start" || parts[1] === "delete") &&
          parts.length === 3
        ) {
          // Complete repl name for repl start/delete
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
    const subcommand = parts[1];

    if (parts.length === 1) {
      // Complete command
      setInput(suggestion + " ");
    } else if (command === "repl" && parts.length === 2) {
      // Complete repl subcommand
      setInput(`repl ${suggestion} `);
    } else if (
      command === "repl" &&
      subcommand === "create" &&
      parts.length === 4
    ) {
      // Complete template for repl create
      const newCommand = `${parts[0]} ${parts[1]} ${parts[2]} ${suggestion} `;
      setInput(newCommand);
    } else if (
      command === "repl" &&
      (subcommand === "start" || subcommand === "delete") &&
      parts.length === 3
    ) {
      // Complete repl name for repl start/delete
      const newCommand = `${parts[0]} ${parts[1]} ${suggestion} `;
      setInput(newCommand);
    }

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

  // Determine suggestion label based on context
  const getSuggestionLabel = (currentInput: string) => {
    const parts = currentInput.trim().split(" ");
    const command = parts[0];
    const subcommand = parts[1];

    if (command === "repl" && subcommand === "create" && parts.length === 4) {
      return "Available Templates:";
    } else if (
      command === "repl" &&
      (subcommand === "start" || subcommand === "delete") &&
      parts.length === 3
    ) {
      return "Available Repls:";
    } else if (command === "repl" && parts.length === 2) {
      return "Repl Subcommands:";
    }
    return "Tab Completions:";
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
                    {getSuggestionLabel(input)}
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
