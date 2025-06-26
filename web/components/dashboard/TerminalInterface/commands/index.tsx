// commands/index.ts
import { CommandRegistry } from "@/types/dashboard";
import {
  versionCommand,
  statusCommand,
  templatesCommand,
  helpCommand,
  clearCommand,
  whoamiCommand,
  lsCommand,
  neofetchCommand,
} from "./basic";
import { replCommand } from "./repl";

export const createCommandRegistry = (): CommandRegistry => ({
  help: helpCommand,
  version: versionCommand,
  status: statusCommand,
  templates: templatesCommand,
  repl: replCommand,
  clear: clearCommand,
  whoami: whoamiCommand,
  ls: lsCommand,
  neofetch: neofetchCommand,
});

// Export individual commands for easy extension

export * from "./basic";
export * from "./repl";
