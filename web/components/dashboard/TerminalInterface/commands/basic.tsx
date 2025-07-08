// commands/basic.ts
import templates from "@/lib/templates";
import { Command } from "@/types/dashboard";

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
1. Create a new repl: repl create <n> <template>
2. Activate your repl: repl activate <n>
3. List all repls: repl list
4. List active repls: repl list --active

💡 Example workflow:
   repl create my-app node
   repl activate my-app
   ls --active

💡 Useful commands:
   repl list --detailed    - Show detailed repl info
   ls --active            - Show only active repls
   repl search <query>    - Search repls by name

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
    const activeRepls = repls.filter((repl) => repl.isActive);
    return `╭─────────────────────────────────────────╮
│             SYSTEM STATUS               │
╰─────────────────────────────────────────╯
🟢 System:     Online
🔋 CPU:        ${Math.floor(Math.random() * 30) + 10}%
💾 Memory:     ${Math.floor(Math.random() * 40) + 20}%
💿 Storage:    ${Math.floor(Math.random() * 60) + 15}%
⏱️ Uptime:     ${uptime}h ${Math.floor(Math.random() * 60)}m
📊 Repls:      ${repls.length} total (${activeRepls.length} active)

💡 Use 'repl list --active' to see active repls`;
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

💡 Usage: repl create <n> <template>
   Example: repl create my-app node`;
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

💡 Try 'repl create <n> <template>' to get started!`;
  },
};

export const lsCommand: Command = {
  name: "ls",
  description: "List all repls (alias for 'repl list')",
  usage: "ls [--detailed] [--active]",
  options: [
    {
      flag: "--detailed",
      description: "Show detailed information about each repl",
      type: "boolean",
    },
    {
      flag: "--active",
      description: "Show only active repls",
      type: "boolean",
    },
  ],
  execute: async (args, options, context) => {
    try {
      const allRepls = await context.getRepls();

      // Filter repls based on --active flag
      const repls = options.active
        ? allRepls.filter((repl) => repl.isActive)
        : allRepls;

      if (repls.length === 0) {
        if (options.active) {
          return `📭 No active repls found.

🚀 Get started by activating a repl:
   ls
   repl activate <n>

💡 Or create a new repl: repl create my-app node`;
        }
        return `📭 No repls found.

🚀 Get started by creating your first repl:
   repl create my-app node
   repl activate my-app

💡 Use 'templates' to see available templates.`;
      }

      // Sort repls: active ones first, then inactive
      const sortedRepls = [...repls].sort((a, b) => {
        const aActive = a.isActive ? 1 : 0;
        const bActive = b.isActive ? 1 : 0;
        return bActive - aActive;
      });

      const detailed = options.detailed || options.d;
      if (detailed) {
        const header = options.active
          ? `╭─────────────────────────────────────────╮\n│            ACTIVE REPL DETAILS          │\n╰─────────────────────────────────────────╯`
          : `╭─────────────────────────────────────────╮\n│               REPL DETAILS              │\n╰─────────────────────────────────────────╯`;

        const replList = sortedRepls
          .map((repl) => {
            const isActive = repl.isActive;
            const statusIcon = isActive ? "🟢" : "⚪";
            const statusText = isActive ? "Running" : "Stopped";
            const actionCommand = isActive
              ? `🛑 Deactivate: repl deactivate ${repl.name}`
              : `🚀 Activate: repl activate ${repl.name}`;

            return `${statusIcon} ${repl.name} (ID: ${repl.id})
   👤 User: ${repl.user}
   ⚡ Status: ${statusText}
   ${actionCommand}`;
          })
          .join("\n\n");

        const footerText = options.active
          ? "💡 Use 'repl deactivate <n>' to stop any active repl."
          : "💡 Use 'repl activate <n>' or 'repl deactivate <n>' to manage repls.";

        return `${header}\n${replList}\n\n${footerText}`;
      }

      const header = options.active
        ? `╭─────────────────────────────────────────╮\n│              ACTIVE REPLS               │\n╰─────────────────────────────────────────╯`
        : `╭─────────────────────────────────────────╮\n│               ALL REPLS                 │\n╰─────────────────────────────────────────╯`;

      const replList = sortedRepls
        .map((repl, i) => {
          const isActive = repl.isActive;
          const statusIcon = isActive ? "🟢" : "⚪";
          const link = isActive
            ? ` - <a href="/repl/${repl.id}" class="text-blue-400 underline">Open</a>`
            : "";
          return `${i + 1}. ${statusIcon} 📁 ${repl.name} (${repl.id})${link}`;
        })
        .join("\n");

      const footerText = options.active
        ? "💡 Use 'repl deactivate <n>' to stop any repl or 'ls --detailed --active' for more info."
        : "💡 Use 'repl activate <n>' to activate a repl or 'ls --detailed' for more info.";

      return `${header}\n${replList}\n\n${footerText}`;
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

💡 Ready to code! Try 'repl create <n> <template>'`;
  },
};
