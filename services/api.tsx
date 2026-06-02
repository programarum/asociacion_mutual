import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api",
    timeout: 10000, // 10 segundos de timeout
});

// Interceptor: agregar token a requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor de respuesta para manejar errores de conexión globalmente
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
            // El servidor respondió con un código de error
            const status = error.response.status;
            if (status === 500) {
                errorMessage = "Error interno del servidor.";
            } else if (status === 503) {
                errorMessage =
                    "El servidor no está disponible en este momento.";
            } else if (status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                window.location.href = '/';
                errorMessage = "No autorizado. Por favor inicie sesión de nuevo.";
            } else if (status === 403) {
                errorMessage = "No tiene permisos para esta acción.";
            }
        }

        // Emitir evento personalizado para que la UI muestre el error
        if (typeof window !== "undefined") {
            const event = new CustomEvent("api-connection-error", {
                detail: { message: errorMessage, status: error.response?.status },
            });
            window.dispatchEvent(event);
        }

        // Re-lanzar el error para que los catch existentes sigan funcionando
        return Promise.reject(error);
    }
);

export default api;