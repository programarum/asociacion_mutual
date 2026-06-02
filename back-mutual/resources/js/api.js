/**
 * Configuración de Axios para Sanctum
 *
 * Este archivo configura Axios para trabajar con Sanctum y guardar tokens
 * en localStorage
 */

import axios from 'axios';

// URL base del backend
const API_BASE_URL = 'http://localhost:8000/api';

// Crear instancia de axios
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

/**
 * Interceptor de request
 * Agrega el token a cada petición si existe
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Interceptor de response
 * Maneja errores de autenticación
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expirado o inválido
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login'; // Redirigir al login
        }
        return Promise.reject(error);
    }
);

export default api;
