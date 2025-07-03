export interface Repl {
  id: string;
  name: string;
  template: string;
  createdAt: string;
}

export interface StoredRepl {
  id: string;
  name: string;
  user: string;
  isActive: bool;
  templateKey?: string;
}

export interface HistoryEntry {
  type: "command" | "output" | "error" | "success" | "info";
  content: string;
  timestamp: string;
}

export interface CommandExecutionContext {
  userName: string;
  getRepls: () => Promise<StoredRepl[]>;
  createRepl: (templateKey: string, replName: string) => Promise<void>;
  startRepl: (replId: string) => Promise<void>;
  deleteReplSession: (replId: string) => Promise<void>;
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
  repls: StoredRepl[];
  setRepls: React.Dispatch<React.SetStateAction<StoredRepl[]>>;
}

export interface CommandArgument {
  name: string;
  description: string;
  required: boolean;
  type: "string" | "number" | "boolean";
  choices?: string[];
}

export interface CommandOption {
  flag: string;
  description: string;
  type: "string" | "number" | "boolean";
}

export interface ParsedCommand {
  command: string;
  subcommand?: string;
  args: string[];
  options: Record<string, any>;
}

export interface SubCommand {
  name: string;
  description: string;
  usage: string;
  arguments?: CommandArgument[];
  options?: CommandOption[];
  execute: (
    args: string[],
    options: Record<string, any>,
    context: CommandExecutionContext,
  ) => Promise<string> | string;
  suggestions?: (
    args: string[],
    context: CommandExecutionContext,
  ) => Promise<string[]> | string[];
}

export interface Command {
  name: string;
  description: string;
  usage: string;
  arguments?: CommandArgument[];
  options?: CommandOption[];
  subcommands?: Record<string, SubCommand>;
  execute: (
    args: string[],
    options: Record<string, any>,
    context: CommandExecutionContext,
  ) => Promise<string> | string;
  suggestions?: (
    args: string[],
    context: CommandExecutionContext,
  ) => Promise<string[]> | string[];
}

export interface CommandRegistry {
  [key: string]: Command;
}

// Legacy types for backward compatibility
export interface Commands {
  [key: string]: {
    description: string;
    usage: string;
    execute: (args: string[], context: any) => Promise<string> | string;
  };
}

export interface CommandContext {
  repls: StoredRepl[];
  setRepls: React.Dispatch<React.SetStateAction<StoredRepl[]>>;
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
}
