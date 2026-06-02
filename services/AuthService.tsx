import api from "./api";

// Interfaces de tipos
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

// Claves de localStorage
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const AuthService = {
    /**
     * Registrar un nuevo usuario
     * POST /api/register
     */
    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/register", data);

        // Guardar token y usuario en localStorage
        localStorage.setItem(TOKEN_KEY, response.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

        return response.data;
    },

    /**
     * Iniciar sesión
     * POST /api/login
     */
    async login(data: LoginData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/login", data);

        // Guardar token y usuario en localStorage
        localStorage.setItem(TOKEN_KEY, response.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

        return response.data;
    },

    /**
     * Cerrar sesión
     * POST /api/logout (protegido)
     */
    async logout(): Promise<void> {
        try {
            await api.post("/logout");
        } finally {
            // Siempre limpiar localStorage, incluso si el servidor falla
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        }
    },

    /**
     * Obtener el usuario actual desde localStorage
     * Retorna null si no hay usuario guardado
     */
    getCurrentUser(): User | null {
        const userStr = localStorage.getItem(USER_KEY);
        if (!userStr) return null;

        try {
            return JSON.parse(userStr) as User;
        } catch {
            return null;
        }
    },

    /**
     * Verificar si el usuario está autenticado
     * Comprueba que exista un token en localStorage
     */
    isAuthenticated(): boolean {
        return !!localStorage.getItem(TOKEN_KEY);
    },
};

export default AuthService;
export type { User, AuthResponse, RegisterData, LoginData };
