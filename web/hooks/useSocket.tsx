import { useEffect, useRef, useState } from "react";

export type Events = {
  Loaded: (data: { rootContents: any }) => void;
  fetchDirResponse: (data: any) => void;
  fetchContentResponse: (data: any) => void;
  updateContentResponse: (data: any) => void;
  terminalResponse: (data: any) => void;
  terminalClosed: (data: any) => void;
};

type EventHandler = (...args: any[]) => void;

interface Socket extends WebSocket {
  emit?: (event: string, data?: any) => void;
  on?: (event: keyof Events, handler: EventHandler) => void;
  off?: (event: keyof Events) => void;
}

export function useRunnerSocket(replId: string) {
  const socketRef = useRef<Socket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Record<string, EventHandler[]>>({});

  useEffect(() => {
    const socket: Socket = new WebSocket("ws://localhost:8081/api/v1/repl/ws");

    // Extend native WebSocket with .emit/.on/.off
    socket.emit = (event: string, data: any) => {
      socket.send(JSON.stringify({ event, data }));
    };

    socket.on = (event: keyof Events, handler: EventHandler) => {
      if (!listenersRef.current[event]) {
        listenersRef.current[event] = [];
      }
      listenersRef.current[event].push(handler);
    };

    socket.off = (event) => {
      delete listenersRef.current[event];
    };

    socket.addEventListener("open", () => {
      setIsConnected(true);
      console.log("✅ Connected to runner WebSocket");
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
      console.warn("⚠️ Disconnected from runner WebSocket");
    });

    socket.addEventListener("error", (err) => {
      console.error("❌ WebSocket error:", err);
    });

    socket.addEventListener("message", (msg) => {
      try {
        const parsed = JSON.parse(msg.data);
        const { event, data } = parsed;

        const handlers = listenersRef.current[event];
        if (handlers) {
          handlers.forEach((fn) => fn(data));
        }
      } catch (err) {
        console.error("❌ Failed to parse WebSocket message:", err);
      }
    });

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
      listenersRef.current = {};
    };
  }, [replId]);

  // Proxy functions (typed)
  const emit = (event: string, payload?: any) => {
    socketRef.current?.emit?.(event, payload);
  };

  const on = <K extends keyof Events>(event: K, handler: Events[K]) => {
    socketRef.current?.on?.(event, handler as EventHandler);
  };

  const off = (event: keyof Events) => {
    socketRef.current?.off?.(event);
  };

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    off,
  };
}
