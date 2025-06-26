// commands/basic.ts
import { Command } from "@/types/dashboard";

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

const ASCII_BANNER = `

  ██████╗ ███████╗██╗   ██╗██╗  ██╗            ██████╗██╗      ██████╗ ██╗   ██╗██████╗     ██╗██████╗ ███████╗
  ██╔══██╗██╔════╝██║   ██║╚██╗██╔╝    ██╗    ██╔════╝██║     ██╔═══██╗██║   ██║██╔══██╗    ██║██╔══██╗██╔════╝
  ██║  ██║█████╗  ██║   ██║ ╚███╔╝     ╚═╝    ██║     ██║     ██║   ██║██║   ██║██║  ██║    ██║██║  ██║█████╗
  ██║  ██║██╔══╝  ╚██╗ ██╔╝ ██╔██╗     ██╗    ██║     ██║     ██║   ██║██║   ██║██║  ██║    ██║██║  ██║██╔══╝
  ██████╔╝███████╗ ╚████╔╝ ██╔╝ ██╗    ╚═╝    ╚██████╗███████╗╚██████╔╝╚██████╔╝██████╔╝    ██║██████╔╝███████╗
  ╚═════╝ ╚══════╝  ╚═══╝  ╚═╝  ╚═╝            ╚═════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝     ╚═╝╚═════╝ ╚══════╝

`;

export const helpCommand: Command = {
  name: "help",
  description: "Show available commands and getting started guide",
  usage: "help [command]",
  arguments: [
    {
      name: "command",
      description: "Specific command to get help for",
      required: false,
      type: "string",
    },
  ],
  execute: async (args, options, context) => {
    if (args.length > 0) {
      // Help for specific command would be handled by the command parser
      return `Use '${args[0]} --help' for detailed help on that command.`;
    }

    const commands = [
      "help",
      "version",
      "status",
      "templates",
      "repl",
      "clear",
      "whoami",
      "ls",
      "neofetch",
    ];

    const commandList = commands
      .map((cmd) => `  ${cmd.padEnd(12)} - Available command`)
      .join("\n");

    return `╭─────────────────────────────────────────╮
│             AVAILABLE COMMANDS          │
╰─────────────────────────────────────────╯
${commandList}

╭─────────────────────────────────────────╮
│             GETTING STARTED             │
╰─────────────────────────────────────────╯
🚀 Quick Start Guide:
1. Create a new repl: repl create <name> <template>
2. Activate your repl: repl activate <name>
3. List all repls: repl list

💡 Example workflow:
   repl create my-app node-js
   repl activate my-app

Type <command> --help for detailed usage information.`;
  },
};

export const versionCommand: Command = {
  name: "version",
  description: "Show application version and system information",
  usage: "version",
  execute: async (args, options, context) => {
    return `╭─────────────────────────────────────────╮
│             SYSTEM INFO                 │
╰─────────────────────────────────────────╯
devX v2.0.0 - Next-Gen Terminal Interface
Built with React & TypeScript
Status: Online ✓`;
  },
};

export const statusCommand: Command = {
  name: "status",
  description: "Display comprehensive system status and metrics",
  usage: "status",
  execute: async (args, options, context) => {
    const uptime = Math.floor(Math.random() * 72) + 1;
    const repls = await context.getRepls();
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
};

export const templatesCommand: Command = {
  name: "templates",
  description: "Show available templates for creating new repls",
  usage: "templates",
  execute: async (args, options, context) => {
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
};

export const clearCommand: Command = {
  name: "clear",
  description: "Clear the terminal screen and reset history",
  usage: "clear",
  execute: async (args, options, context) => {
    context.setHistory([
      {
        type: "info",
        content: "🚀 devX Terminal v2.0.0 - Ready for commands",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    return "";
  },
};

export const whoamiCommand: Command = {
  name: "whoami",
  description: "Display current user information and session details",
  usage: "whoami",
  execute: async (args, options, context) => {
    return `╭─────────────────────────────────────────╮
│              USER PROFILE               │
╰─────────────────────────────────────────╯
👤 User:       ${context.userName}
🏠 Home:       /home/${context.userName}
🐚 Shell:      devX Terminal v2.0.0
🌐 Session:    ${new Date().toLocaleString()}

💡 Try 'repl create <name> <template>' to get started!`;
  },
};

export const lsCommand: Command = {
  name: "ls",
  description: "List all repls (alias for 'repl list')",
  usage: "ls [--detailed]",
  options: [
    {
      flag: "--detailed",
      description: "Show detailed information about each repl",
      type: "boolean",
    },
  ],
  execute: async (args, options, context) => {
    try {
      const repls = await context.getRepls();

      if (repls.length === 0) {
        return `📭 No repls found.

🚀 Get started by creating your first repl:
   repl create my-app node-js
   repl activate my-app

💡 Use 'templates' to see available templates.`;
      }

      const detailed = options.detailed || options.d;
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
   🚀 Activate: repl activate ${repl.name}`,
          )
          .join("\n\n");
        return `${header}\n${replList}\n\n💡 Use 'repl activate <name>' to activate any repl.`;
      }

      const header = `╭─────────────────────────────────────────╮
│               ACTIVE REPLS              │
╰─────────────────────────────────────────╯`;
      return `${header}\n${repls.map((repl, i) => `${i + 1}. 📁 ${repl.name} (${repl.id})`).join("\n")}\n\n💡 Use 'repl activate <name>' to activate a repl or 'repl list --detailed' for more info.`;
    } catch (error: any) {
      return `❌ Error fetching repls: ${error.message || "Unknown error"}`;
    }
  },
};

export const neofetchCommand: Command = {
  name: "neofetch",
  description: "Display system information in a stylized format",
  usage: "neofetch",
  execute: async (args, options, context) => {
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
};
