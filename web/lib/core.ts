import { AuthStatus, User } from "@/types/auth";
import { StoredRepl } from "@/types/dashboard";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL || "http://localhost:8080";

export class CoreService {
  private static instance: CoreService;
  public github: GithubService;

  private constructor() {
    this.github = new GithubService();
  }

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
      await axios.get(this.url(`/api/repl/${replName}`), {
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

  async deleteRepl(replName: string) {
    try {
      await axios.delete(this.url(`/api/repl/${replName}`), {
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

class GithubService {
  // Redirect to GitHub OAuth
  async login(): Promise<void> {
    window.location.href = `${API_BASE_URL}/auth/github/login`;
  }

  // Logout user
  async logout(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/github/logout`, {
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
      const response = await fetch(`${API_BASE_URL}/auth/github/me`, {
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
      const response = await fetch(`${API_BASE_URL}/auth/github/status`, {
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
}
