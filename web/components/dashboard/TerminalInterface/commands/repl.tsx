// commands/repl.ts
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

export const replCommand: Command = {
  name: "repl",
  description: "Manage repls - create, activate, deactivate, and list repls",
  usage: "repl <subcommand> [options]",
  subcommands: {
    create: {
      name: "create",
      description: "Create a new repl",
      usage: "repl create <name> <template>",
      arguments: [
        {
          name: "name",
          description: "Name for the new repl",
          required: true,
          type: "string",
        },
        {
          name: "template",
          description: "Template to use for the repl",
          required: true,
          type: "string",
          choices: Object.keys(templates),
        },
      ],
      execute: async (args, options, context) => {
        const [name, templateKey] = args;

        if (!templates[templateKey as keyof typeof templates]) {
          const templateList = Object.keys(templates).join(", ");
          return `❌ Error: Invalid template "${templateKey}"\nAvailable templates: ${templateList}\n\n💡 Use 'templates' command to see all available templates.`;
        }

        try {
          const template = templates[templateKey as keyof typeof templates];
          await context.createRepl(template.key, name);
          return `✅ Successfully created repl "${name}"\n   Template: ${template.name}\n   Key: ${template.key}\n   Status: Ready\n\n🚀 Next step: Activate your repl with 'repl activate ${name}'`;
        } catch (error: any) {
          return `❌ Error creating repl: ${error.message || "Unknown error"}`;
        }
      },
      suggestions: async (args, context) => {
        if (args.length === 1) {
          return Object.keys(templates);
        }
        return [];
      },
    },

    activate: {
      name: "activate",
      description: "Activate an existing repl",
      usage: "repl activate <name>",
      arguments: [
        {
          name: "name",
          description: "Name of the repl to activate",
          required: true,
          type: "string",
        },
      ],
      execute: async (args, options, context) => {
        const [replName] = args;
        const replNameLower = replName.toLowerCase();

        try {
          const repls = await context.getRepls();
          const repl = repls.find(
            (r) => r.name.toLowerCase() === replNameLower,
          );

          if (!repl) {
            const availableRepls = repls.map((r) => r.name).join(", ");
            return `❌ Error: Repl with name "${replName}" not found.\n${repls.length > 0 ? `Available repls: ${availableRepls}` : "No repls found."}\n\n💡 Use 'repl list' to see all repls or 'repl create <name> <template>' to create one.`;
          }

          await context.startRepl(repl.id);
          return `🚀 Successfully activated repl "${repl.name}"\n   Status: Running\n   ID: ${repl.id}`;
        } catch (error: any) {
          return `❌ Error activating repl: ${error.message || "Unknown error"}`;
        }
      },
      suggestions: async (args, context) => {
        const repls = await context.getRepls();
        return repls.map((repl) => repl.name);
      },
    },

    deactivate: {
      name: "deactivate",
      description: "Deactivate a repl",
      usage: "repl deactivate <name>",
      arguments: [
        {
          name: "name",
          description: "Name of the repl to deactivate",
          required: true,
          type: "string",
        },
      ],
      execute: async (args, options, context) => {
        const [replName] = args;
        const replNameLower = replName.toLowerCase();

        try {
          const repls = await context.getRepls();
          const repl = repls.find(
            (r) => r.name.toLowerCase() === replNameLower,
          );

          if (!repl) {
            const availableRepls = repls.map((r) => r.name).join(", ");
            return `❌ Error: Repl with name "${replName}" not found.\n${repls.length > 0 ? `Available repls: ${availableRepls}` : "No repls found."}\n\n💡 Use 'repl list' to see all available repls.`;
          }

          await context.deleteReplSession(repl.id);
          return `🗑️ Successfully deactivated repl "${repl.name}"\n   ID: ${repl.id}\n\n💡 Use 'repl create <name> <template>' to create a new repl.`;
        } catch (error: any) {
          return `❌ Error deactivating repl: ${error.message || "Unknown error"}`;
        }
      },
      suggestions: async (args, context) => {
        const repls = await context.getRepls();
        return repls.map((repl) => repl.name);
      },
    },

    list: {
      name: "list",
      description: "List all repls",
      usage: "repl list [--detailed] [--active]",
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
              return `📭 No active repls found.\n\n🚀 Get started by activating a repl:\n   repl list\n   repl activate <name>\n\n💡 Or create a new repl: repl create my-app node-js`;
            }
            return `📭 No repls found.\n\n🚀 Get started by creating your first repl:\n   repl create my-app node-js\n   repl activate my-app\n\n💡 Use 'templates' to see available templates.`;
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

                return `${statusIcon} ${repl.name} (ID: ${repl.id})\n   👤 User: ${repl.user}\n   ⚡ Status: ${statusText}\n   ${actionCommand}`;
              })
              .join("\n\n");

            const footerText = options.active
              ? "💡 Use 'repl deactivate <name>' to stop any active repl."
              : "💡 Use 'repl activate <name>' or 'repl deactivate <name>' to manage repls.";

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
            ? "💡 Use 'repl deactivate <name>' to stop any repl or 'repl list --detailed --active' for more info."
            : "💡 Use 'repl activate <name>' to activate a repl or 'repl list --detailed' for more info.";

          return `${header}\n${replList}\n\n${footerText}`;
        } catch (error: any) {
          return `❌ Error fetching repls: ${error.message || "Unknown error"}`;
        }
      },
    },

    search: {
      name: "search",
      description: "Search repls by name",
      usage: "repl search <query>",
      arguments: [
        {
          name: "query",
          description: "Search query to match repl names",
          required: true,
          type: "string",
        },
      ],
      execute: async (args, options, context) => {
        const query = args.join(" ").toLowerCase();

        try {
          const repls = await context.getRepls();
          const matches = repls.filter((repl) =>
            repl.name.toLowerCase().includes(query),
          );

          if (matches.length === 0) {
            return `🔍 No repls found matching "${query}"\n\n💡 Use 'repl list' to see all repls or 'repl create <name> <template>' to create one.`;
          }

          // Sort matches: active ones first
          const sortedMatches = [...matches].sort((a, b) => {
            const aActive = a.isActive ? 1 : 0;
            const bActive = b.isActive ? 1 : 0;
            return bActive - aActive;
          });

          const header = `╭─────────────────────────────────────────╮\n│             SEARCH RESULTS              │\n╰─────────────────────────────────────────╯`;
          const resultList = sortedMatches
            .map((repl, i) => {
              const isActive = repl.isActive;
              const statusIcon = isActive ? "🟢" : "⚪";
              return `${i + 1}. ${statusIcon} 📁 ${repl.name} (${repl.id})`;
            })
            .join("\n");

          return `${header}\n🔍 Found ${sortedMatches.length} repl(s) matching "${query}":\n${resultList}\n\n💡 Use 'repl activate <name>' or 'repl deactivate <name>' to manage these repls.`;
        } catch (error: any) {
          return `❌ Error searching repls: ${error.message || "Unknown error"}`;
        }
      },
    },
  },

  execute: async (args, options, context) => {
    return `╭─────────────────────────────────────────╮\n│               REPL MANAGER              │\n╰─────────────────────────────────────────╯\nAvailable subcommands:\n  create <name> <template>     - Create a new repl\n  activate <name>              - Activate an existing repl\n  deactivate <name>            - Deactivate a repl\n  list [--detailed] [--active] - List all repls\n  search <query>               - Search repls by name\n\n💡 Examples:\n   repl create my-app node-js\n   repl activate my-app\n   repl deactivate old-project\n   repl list --detailed\n   repl list --active\n\nUse 'templates' to see available templates.`;
  },
};
