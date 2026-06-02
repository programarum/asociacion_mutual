/**
 * Servicio de Usuarios (Admin)
 *
 * Métodos para gestionar usuarios (solo administrador)
 */

import api from '../api';

const UserService = {
    /**
     * Obtener todos los usuarios
     */
    getAllUsers() {
        return api.get('/users').then((response) => {
            return response.data.users;
        });
    },

    /**
     * Cambiar rol de un usuario
     */
    changeUserRole(userId, role) {
        return api.put(`/users/${userId}/role`, {
            role,
        }).then((response) => {
            return response.data.user;
        });
    },

    /**
     * Eliminar un usuario
     */
    deleteUser(userId) {
        return api.delete(`/users/${userId}`).then((response) => {
            return response.data;
        });
    },
};

export default UserService;
