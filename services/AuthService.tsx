import api from "./api";

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

interface AuthResponse {
    message: string;
    user: User;
    token: string;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

interface LoginData {
    email: string;
    password: string;
}

const USER_KEY = "auth_user";
const TOKEN_KEY = "auth_token";

const AuthService = {
    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/register", data);
        localStorage.setItem(TOKEN_KEY, response.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        return response.data;
    },

    async login(data: LoginData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/login", data);
        localStorage.setItem(TOKEN_KEY, response.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        return response.data;
    },

    async logout(): Promise<void> {
        try {
            await api.post("/logout");
        } finally {
            localStorage.removeItem(TOKEN_KEY);
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
        return !!localStorage.getItem(TOKEN_KEY);
    },
};

export default AuthService;
export type { User, AuthResponse, RegisterData, LoginData };
