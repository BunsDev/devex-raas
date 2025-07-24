interface TerminalSession {
  ref: RefObject<TerminalRef | null>;
  status: "connected" | "connecting" | "disconnected";
  error: string | null;
}
