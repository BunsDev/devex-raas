// utils/commandParser.ts
import { ParsedCommand, Command, SubCommand } from "@/types/dashboard";

export class CommandParser {
  static parseCommand(input: string): ParsedCommand {
    const parts = input.trim().split(/\s+/);
    const command = parts[0];
    const options: Record<string, any> = {};
    const args: string[] = [];
    let subcommand: string | undefined;

    let i = 1;
    while (i < parts.length) {
      const part = parts[i];

      if (part.startsWith("--")) {
        // Long option
        const [optionName, optionValue] = part.substring(2).split("=", 2);
        if (optionValue !== undefined) {
          options[optionName] = optionValue;
        } else if (i + 1 < parts.length && !parts[i + 1].startsWith("-")) {
          options[optionName] = parts[i + 1];
          i++;
        } else {
          options[optionName] = true;
        }
      } else if (part.startsWith("-")) {
        // Short option
        const optionName = part.substring(1);
        if (i + 1 < parts.length && !parts[i + 1].startsWith("-")) {
          options[optionName] = parts[i + 1];
          i++;
        } else {
          options[optionName] = true;
        }
      } else {
        // Regular argument
        if (!subcommand && args.length === 0) {
          subcommand = part;
        } else {
          args.push(part);
        }
      }
      i++;
    }

    return { command, subcommand, args, options };
  }

  static formatHelp(command: Command, subcommand?: SubCommand): string {
    const target = subcommand || command;
    const commandName = subcommand
      ? `${command.name} ${subcommand.name}`
      : command.name;

    let help = `╭─────────────────────────────────────────╮\n`;
    help += `│               COMMAND HELP              │\n`;
    help += `╰─────────────────────────────────────────╯\n`;
    help += `📖 ${target.description}\n`;
    help += `💻 Usage: ${target.usage}\n`;

    if (target.arguments && target.arguments.length > 0) {
      help += `\n📋 Arguments:\n`;
      target.arguments.forEach((arg) => {
        const required = arg.required ? " (required)" : " (optional)";
        help += `  ${arg.name.padEnd(12)} - ${arg.description}${required}\n`;
        if (arg.choices) {
          help += `${" ".repeat(16)}Choices: ${arg.choices.join(", ")}\n`;
        }
      });
    }

    if (target.options && target.options.length > 0) {
      help += `\n⚙️  Options:\n`;
      target.options.forEach((option) => {
        help += `  ${option.flag.padEnd(12)} - ${option.description}\n`;
      });
    }

    if (command.subcommands && !subcommand) {
      help += `\n🔧 Subcommands:\n`;
      Object.values(command.subcommands).forEach((sub) => {
        help += `  ${sub.name.padEnd(12)} - ${sub.description}\n`;
      });
    }

    return help;
  }

  static validateArguments(
    args: string[],
    command: Command,
    subcommand?: SubCommand,
  ): { valid: boolean; error?: string } {
    const target = subcommand || command;
    if (!target.arguments) return { valid: true };

    const requiredArgs = target.arguments.filter((arg) => arg.required);
    if (args.length < requiredArgs.length) {
      const missingArgs = requiredArgs
        .slice(args.length)
        .map((arg) => arg.name);
      return {
        valid: false,
        error: `Missing required arguments: ${missingArgs.join(", ")}`,
      };
    }

    // Validate argument choices
    for (let i = 0; i < args.length && i < target.arguments.length; i++) {
      const arg = target.arguments[i];
      const value = args[i];

      if (arg.choices && !arg.choices.includes(value)) {
        return {
          valid: false,
          error: `Invalid value '${value}' for argument '${arg.name}'. Valid choices: ${arg.choices.join(", ")}`,
        };
      }
    }

    return { valid: true };
  }
}
