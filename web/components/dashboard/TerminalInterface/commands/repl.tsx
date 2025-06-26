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

          await context.deleteRepl(repl.id);
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
      usage: "repl list [--detailed]",
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
            return `📭 No repls found.\n\n🚀 Get started by creating your first repl:\n   repl create my-app node-js\n   repl activate my-app\n\n💡 Use 'templates' to see available templates.`;
          }

          const detailed = options.detailed || options.d;
          if (detailed) {
            const header = `╭─────────────────────────────────────────╮\n│               REPL DETAILS              │\n╰─────────────────────────────────────────╯`;
            const replList = repls
              .map(
                (repl) =>
                  `📁 ${repl.name} (ID: ${repl.id})\n   👤 User: ${repl.user}\n   ⚡ Status: Active\n   🚀 Activate: repl activate ${repl.name}`,
              )
              .join("\n\n");
            return `${header}\n${replList}\n\n💡 Use 'repl activate <name>' to activate any repl.`;
          }

          const header = `╭─────────────────────────────────────────╮\n│               ACTIVE REPLS              │\n╰─────────────────────────────────────────╯`;
          return `${header}\n${repls.map((repl, i) => `${i + 1}. 📁 ${repl.name} (${repl.id})`).join("\n")}\n\n💡 Use 'repl activate <name>' to activate a repl or 'repl list --detailed' for more info.`;
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

          const header = `╭─────────────────────────────────────────╮\n│             SEARCH RESULTS              │\n╰─────────────────────────────────────────╯`;
          return `${header}\n🔍 Found ${matches.length} repl(s) matching "${query}":\n${matches.map((repl, i) => `${i + 1}. 📁 ${repl.name} (${repl.id})`).join("\n")}\n\n💡 Use 'repl activate <name>' to activate any of these repls.`;
        } catch (error: any) {
          return `❌ Error searching repls: ${error.message || "Unknown error"}`;
        }
      },
    },
  },

  execute: async (args, options, context) => {
    return `╭─────────────────────────────────────────╮\n│               REPL MANAGER              │\n╰─────────────────────────────────────────╯\nAvailable subcommands:\n  create <name> <template>  - Create a new repl\n  activate <name>             - Activate an existing repl\n  deactivate <name>            - Deactivate a repl\n  list [--detailed]        - List all repls\n  search <query>           - Search repls by name\n\n💡 Examples:\n   repl create my-app node-js\n   repl activate my-app\n   repl deactivate old-project\n   repl list --detailed\n\nUse 'templates' to see available templates.`;
  },
};
