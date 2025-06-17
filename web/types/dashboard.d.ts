// Types
export interface Repl {
  id: string;
  name: string;
  template: string;
  createdAt: string;
}

export interface HistoryEntry {
  type: "info" | "command" | "output" | "error" | "success";
  content: string;
  timestamp?: string;
}

export interface CommandContext {
  repls: Repl[];
  setRepls: React.Dispatch<React.SetStateAction<Repl[]>>;
  setHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>;
}

export interface Command {
  description: string;
  usage: string;
  execute: (args: string[], context: CommandContext) => string | void;
}

export interface Commands {
  [key: string]: Command;
}
