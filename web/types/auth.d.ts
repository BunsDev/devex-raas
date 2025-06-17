export interface User {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  created_at: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
  token_expires_at?: string;
}
