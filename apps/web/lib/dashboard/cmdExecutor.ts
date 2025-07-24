// utils/commandExecutor.ts
import {
  CommandRegistry,
  CommandExecutionContext,
  HistoryEntry,
} from "@/types/dashboard";
import { CommandParser } from "./cmdParser";

export class CommandExecutor {
  constructor(private commands: CommandRegistry) {}

  async executeCommand(
    commandLine: string,
    context: CommandExecutionContext,
  ): Promise<void> {
    const trimmed = commandLine.trim();
    if (!trimmed) return;

    const parsed = CommandParser.parseCommand(trimmed);
    const command = this.commands[parsed.command];
    const timestamp = new Date().toLocaleTimeString();

    // Add command to history
    context.setHistory((prev) => [
      ...prev,
      {
        type: "command",
        content: `┌─ ${context.userName}@devX ~\n└─$ ${commandLine}`,
        timestamp,
      },
    ]);

    if (!command) {
      context.setHistory((prev) => [
        ...prev,
        {
          type: "error",
          content: `❌ Command not found: '${parsed.command}'\n💡 Type "help" to see available commands.`,
          timestamp,
        },
      ]);
      return;
    }

    // Check for help flags
    if (parsed.options.help || parsed.options.h) {
      const helpText = this.getHelpText(command, parsed.subcommand);
      context.setHistory((prev) => [
        ...prev,
        { type: "output", content: helpText, timestamp },
      ]);
      return;
    }

    try {
      let result: string;

      // Execute subcommand if it exists
      if (parsed.subcommand && command.subcommands) {
        const subcommand = command.subcommands[parsed.subcommand];
        if (!subcommand) {
          const availableSubcommands = Object.keys(command.subcommands).join(
            ", ",
          );
          result = `❌ Unknown subcommand: ${parsed.subcommand}\nAvailable subcommands: ${availableSubcommands}\nUse '${command.name} --help' for more information.`;
        } else {
          // Validate arguments for subcommand
          const validation = CommandParser.validateArguments(
            parsed.args,
            command,
            subcommand,
          );
          if (!validation.valid) {
            result = `❌ ${validation.error}\nUse '${command.name} ${subcommand.name} --help' for usage information.`;
          } else {
            result = await subcommand.execute(
              parsed.args,
              parsed.options,
              context,
            );
          }
        }
      } else {
        // Validate arguments for main command
        const validation = CommandParser.validateArguments(
          parsed.args,
          command,
        );
        if (!validation.valid) {
          result = `❌ ${validation.error}\nUse '${command.name} --help' for usage information.`;
        } else {
          result = await command.execute(parsed.args, parsed.options, context);
        }
      }

      // Add result to history if not empty and not clear command
      if (result && parsed.command !== "clear") {
        context.setHistory((prev) => [
          ...prev,
          { type: "output", content: result, timestamp },
        ]);
      }
    } catch (error: any) {
      context.setHistory((prev) => [
        ...prev,
        {
          type: "error",
          content: `💥 Error: ${error.message || "Unknown error occurred"}`,
          timestamp,
        },
      ]);
    }

    // Refresh repls after commands that might change them
    if (
      parsed.command === "repl" &&
      parsed.subcommand &&
      ["create", "delete"].includes(parsed.subcommand)
    ) {
      try {
        const updatedRepls = await context.getRepls();
        context.setRepls(updatedRepls);
      } catch (error) {
        console.error("Failed to refresh repls:", error);
      }
    }
  }

  private getHelpText(command: any, subcommandName?: string): string {
    if (subcommandName && command.subcommands) {
      const subcommand = command.subcommands[subcommandName];
      if (subcommand) {
        return CommandParser.formatHelp(command, subcommand);
      }
    }
    return CommandParser.formatHelp(command);
  }
}
