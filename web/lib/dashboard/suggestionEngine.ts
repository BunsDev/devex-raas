// utils/suggestionEngine.ts
import {
  CommandRegistry,
  CommandExecutionContext,
  ParsedCommand,
} from "@/types/dashboard";
import { CommandParser } from "./cmdParser";

export class SuggestionEngine {
  constructor(private commands: CommandRegistry) {}

  async getSuggestions(
    input: string,
    context: CommandExecutionContext,
  ): Promise<{ suggestions: string[]; label: string }> {
    const trimmed = input.trim();

    if (!trimmed) {
      return {
        suggestions: Object.keys(this.commands),
        label: "Available Commands:",
      };
    }

    const parts = trimmed.split(/\s+/);
    const commandName = parts[0];
    const command = this.commands[commandName];

    // Command name completion
    if (parts.length === 1) {
      const suggestions = Object.keys(this.commands).filter((cmd) =>
        cmd.startsWith(commandName.toLowerCase()),
      );
      return {
        suggestions,
        label: "Available Commands:",
      };
    }

    if (!command) {
      return { suggestions: [], label: "" };
    }

    const parsed = CommandParser.parseCommand(input);

    // Subcommand completion
    if (command.subcommands && parts.length === 2) {
      const subcommandName = parts[1];
      const suggestions = Object.keys(command.subcommands).filter((sub) =>
        sub.startsWith(subcommandName.toLowerCase()),
      );
      return {
        suggestions,
        label: "Available Subcommands:",
      };
    }

    // Custom suggestions from command/subcommand
    const target =
      parsed.subcommand && command.subcommands?.[parsed.subcommand]
        ? command.subcommands[parsed.subcommand]
        : command;

    if (target.suggestions) {
      try {
        const customSuggestions = await target.suggestions(
          parsed.args,
          context,
        );
        const lastArg = parsed.args[parsed.args.length - 1] || "";
        return {
          suggestions: customSuggestions.filter((s) =>
            s.toLowerCase().startsWith(lastArg.toLowerCase()),
          ),
          label: this.getSuggestionLabel(parsed, command),
        };
      } catch (error) {
        console.error("Error getting custom suggestions:", error);
      }
    }

    // Argument-based suggestions
    if (target.arguments) {
      const currentArgIndex = parsed.args.length - 1;
      const currentArg = target.arguments[currentArgIndex];

      if (currentArg?.choices) {
        const currentInput = parsed.args[currentArgIndex] || "";
        const suggestions = currentArg.choices.filter((choice) =>
          choice.toLowerCase().startsWith(currentInput.toLowerCase()),
        );
        return {
          suggestions,
          label: `${currentArg.name} Options:`,
        };
      }
    }

    return { suggestions: [], label: "" };
  }

  private getSuggestionLabel(parsed: ParsedCommand, command: any): string {
    if (parsed.subcommand) {
      return `${command.name} ${parsed.subcommand} suggestions:`;
    }
    return `${command.name} suggestions:`;
  }

  completeInput(input: string, suggestion: string): string {
    const parts = input.trim().split(/\s+/);

    if (parts.length === 1) {
      return suggestion + " ";
    }

    // Replace the last part with the suggestion
    parts[parts.length - 1] = suggestion;
    return parts.join(" ") + " ";
  }
}
