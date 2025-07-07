import { AuthStatus, User } from "@/types/auth";
import { StoredRepl } from "@/types/dashboard";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL || "http://localhost:8080";

export class CoreService {
  private static instance: CoreService;

  private url(route: string) {
    return `${API_BASE_URL}${route}`;
  }

  static getInstance(): CoreService {
    if (!CoreService.instance) {
      CoreService.instance = new CoreService();
    }
    return CoreService.instance;
  }

  // Make authenticated API requests
  async authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const defaultOptions: RequestInit = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    return fetch(`${API_BASE_URL}${url}`, defaultOptions);
  }

  async githubLogin(): Promise<void> {
    window.location.href = `${API_BASE_URL}/auth/github/login`;
  }

  async magiclinkLogin(body: { email: string }) {
    try {
      return await axios.post(this.url("/auth/magiclink/login"), body, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.log("error:", error);
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  }

  // Get current user info
  async getMe(): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Get me error:", error);
      return null;
    }
  }

  // Check authentication status
  async getStatus(): Promise<AuthStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/status`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return { authenticated: false };
      }

      return await response.json();
    } catch (error) {
      console.error("Get status error:", error);
      return { authenticated: false };
    }
  }

  async getRepls() {
    try {
      const response = await axios.get(this.url("/api/repl"), {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      return (response.data as StoredRepl[]) || [];
    } catch (error) {
      console.log("error:", error);
      throw error;
    }
  }

  async newRepl(body: {
    userName: string;
    template: string;
    replName: string;
  }) {
    try {
      await axios.post(this.url("/api/repl/new"), body, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.log("error:", error);
      throw error;
    }
  }

  async startRepl(replName: string) {
    try {
      return (
        await axios.get(this.url(`/api/repl/session/${replName}`), {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        })
      ).data;
    } catch (error) {
      console.log("error:", error);
      throw error;
    }
  }

  async deleteReplSession(replName: string) {
    try {
      await axios.delete(this.url(`/api/repl/session/${replName}`), {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.log("error:", error);
      throw error;
    }
  }

  async deleteReplById(replId: string) {
    try {
      await axios.delete(this.url(`/api/repl/${replId}`), {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.log("error:", error);
      throw error;
    }
  }
}
