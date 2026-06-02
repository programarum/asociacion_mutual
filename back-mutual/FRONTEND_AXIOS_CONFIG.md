# Configuración de Axios y Autenticación con Sanctum

## Instalación

```bash
npm install axios
```

## Estructura de archivos

```
resources/js/
├── api.js                    # Configuración de axios
└── services/
    └── AuthService.js        # Servicio de autenticación
```

---

## 1. Archivo: `resources/js/api.js`

Este archivo configura axios con interceptores para:
- Agregar el token a cada petición automáticamente
- Manejar errores de autenticación (401)
- Redirigir al login si el token expira

```javascript
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
});

// Interceptor: agregar token a requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor: manejo de errores
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
```

---

## 2. Archivo: `resources/js/services/AuthService.js`

Servicio con métodos para:
- `register()` - Registrar usuario
- `login()` - Iniciar sesión
- `logout()` - Cerrar sesión
- `getCurrentUser()` - Obtener usuario del localStorage
- `isAuthenticated()` - Verificar si está autenticado

---

## Ejemplos de uso en componentes

### React - Componente de Login

```jsx
import { useState } from 'react';
import AuthService from '../services/AuthService';

export default function LoginComponent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await AuthService.login(email, password);
            console.log('Login exitoso:', response);
            // Redirigir al dashboard
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin}>
            {error && <div className="error">{error}</div>}
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
            />
            <button type="submit" disabled={loading}>
                {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>
        </form>
    );
}
```

### Vue 3 - Composable de Autenticación

```javascript
// composables/useAuth.js
import { ref, computed } from 'vue';
import AuthService from '@/services/AuthService';

export function useAuth() {
    const user = ref(AuthService.getCurrentUser());
    const token = ref(localStorage.getItem('auth_token'));

    const isAuthenticated = computed(() => AuthService.isAuthenticated());

    const login = async (email, password) => {
        try {
            const response = await AuthService.login(email, password);
            user.value = response.user;
            token.value = response.token;
            return response;
        } catch (error) {
            throw error;
        }
    };

    const register = async (name, email, password, passwordConfirmation) => {
        try {
            const response = await AuthService.register(name, email, password, passwordConfirmation);
            user.value = response.user;
            token.value = response.token;
            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await AuthService.logout();
            user.value = null;
            token.value = null;
        } catch (error) {
            throw error;
        }
    };

    return {
        user,
        token,
        isAuthenticated,
        login,
        register,
        logout,
    };
}
```

```vue
<!-- LoginComponent.vue -->
<template>
    <form @submit.prevent="handleLogin">
        <div v-if="error" class="error">{{ error }}</div>
        <input
            v-model="email"
            type="email"
            placeholder="Email"
            required
        />
        <input
            v-model="password"
            type="password"
            placeholder="Contraseña"
            required
        />
        <button :disabled="loading">
            {{ loading ? 'Iniciando...' : 'Iniciar sesión' }}
        </button>
    </form>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';

const { login } = useAuth();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
    loading.value = true;
    try {
        await login(email.value, password.value);
        window.location.href = '/dashboard';
    } catch (err) {
        error.value = err.response?.data?.message || 'Error al iniciar sesión';
    } finally {
        loading.value = false;
    }
};
</script>
```

---

## Ruta Protegida (React Router)

```jsx
import { Navigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

export function ProtectedRoute({ element }) {
    return AuthService.isAuthenticated() ? element : <Navigate to="/login" />;
}

// En rutas
<Routes>
    <Route path="/login" element={<LoginComponent />} />
    <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
</Routes>
```

---

## Configuración adicional

### CORS en el Backend (si es necesario)

Si el frontend está en diferente puerto/dominio, asegúrate que `config/cors.php` lo permite:

```php
'allowed_origins' => ['http://localhost:3000', 'http://localhost:5173'],
```

### Variables de Entorno

En tu frontend, crea un `.env` o `.env.local`:

```
VITE_API_URL=http://localhost:8000/api
```

Y úsalo en `api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
```

---

## Flujo de Autenticación

1. **Login**:
   - Usuario envía email y password
   - Backend valida y retorna token + usuario
   - Frontend guarda token en localStorage

2. **Peticiones Autenticadas**:
   - Axios intercepta todas las peticiones
   - Agrega `Authorization: Bearer {token}` automáticamente
   - Backend valida el token con Sanctum

3. **Token Expirado**:
   - Si el backend retorna 401
   - Frontend borra token y redirige a login

---

## Headers configurados

```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}  ← Agregado automáticamente por interceptor
```
