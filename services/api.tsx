import axios from "axios";

const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    // Server-side: use env or fallback
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  }
  // Client-side: use env variable
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
};

const api = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 10000,
});

const TOKEN_KEY = "auth_token";

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        let errorMessage = "Ha ocurrido un error inesperado.";

        if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
            errorMessage =
                "No se pudo conectar al servidor. Verifique que el servidor esté en ejecución.";
        } else if (error.code === "ECONNABORTED") {
            errorMessage =
                "La solicitud tardó demasiado. El servidor no responde.";
        } else if (error.response) {
            const status = error.response.status;
            if (status === 500) {
                errorMessage = "Error interno del servidor.";
            } else if (status === 503) {
                errorMessage =
                    "El servidor no está disponible en este momento.";
            } else if (status === 401) {
                const token = localStorage.getItem(TOKEN_KEY);
                const isTokenExpired = !!token && !error.config?.url?.includes('/login');
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem('auth_user');
                errorMessage = isTokenExpired
                    ? "Su sesión ha expirado. Por favor inicie sesión de nuevo."
                    : "No autorizado. Por favor inicie sesión de nuevo.";
                if (typeof window !== "undefined" && !error.config?.url?.includes('/login')) {
                    window.location.href = '/?expired=' + (isTokenExpired ? '1' : '0');
                }
            } else if (status === 403) {
                errorMessage = "Acceso denegado: No tienes permisos para realizar esta acción.";
                console.warn("[API 403]", error.response?.data?.message);
            }
        }

        if (typeof window !== "undefined") {
            const event = new CustomEvent("api-connection-error", {
                detail: { message: errorMessage, status: error.response?.status },
            });
            window.dispatchEvent(event);
        }

        return Promise.reject(error);
    }
);

export default api;