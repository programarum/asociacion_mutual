import { invoke } from "@tauri-apps/api/core";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginData {
  email: string;
  password: string;
}

const USER_KEY = "auth_user";

const AuthService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const result = await invoke<{ user: User }>("login", {
      email: data.email,
      password: data.password,
    });
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    return { message: "Sesión iniciada exitosamente", user: result.user };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const user = await invoke<User>("register", {
      name: data.name,
      email: data.email,
      password: data.password,
    });
    return { message: "Usuario registrado exitosamente", user };
  },

  async logout(): Promise<void> {
    try {
      await invoke("logout");
    } finally {
      localStorage.removeItem(USER_KEY);
    }
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(USER_KEY);
  },
};

export default AuthService;
export type { User as UserType };
