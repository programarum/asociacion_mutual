/**
 * Servicio de Autenticación
 *
 * Métodos para registrar, login, logout y obtener usuario
 */

import api from '../api';

const AuthService = {
    /**
     * Registrar nuevo usuario
     */
    register(name, email, password, passwordConfirmation) {
        return api.post('/register', {
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
        }).then((response) => {
            if (response.data.token) {
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        });
    },

    /**
     * Login
     */
    login(email, password) {
        return api.post('/login', {
            email,
            password,
        }).then((response) => {
            if (response.data.token) {
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        });
    },

    /**
     * Logout
     */
    logout() {
        return api.post('/logout').then((response) => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            return response.data;
        });
    },

    /**
     * Logout de todas las sesiones
     */
    logoutAll() {
        return api.post('/logout-all').then((response) => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            return response.data;
        });
    },

    /**
     * Obtener usuario autenticado
     */
    getUser() {
        return api.get('/user').then((response) => {
            return response.data.user;
        });
    },

    /**
     * Obtener usuario del localStorage
     */
    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    /**
     * Verificar si usuario está autenticado
     */
    isAuthenticated() {
        return !!localStorage.getItem('auth_token');
    },

    /**
     * Actualizar perfil
     */
    updateProfile(name, email, password = null) {
        const data = { name, email };
        if (password) {
            data.password = password;
            data.password_confirmation = password;
        }
        return api.put('/profile', data).then((response) => {
            localStorage.setItem('user', JSON.stringify(response.data.user));
            return response.data;
        });
    },
};

export default AuthService;
