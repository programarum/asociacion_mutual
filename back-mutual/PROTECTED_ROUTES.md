# Protegiendo Rutas: Solo usuarios autenticados

---

## 🔒 React Router v6

### Paso 1: Crear componente ProtectedRoute

**File:** `components/ProtectedRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom';
import AuthService from '../services/AuthService';

export default function ProtectedRoute({ element }) {
    // Si NO está autenticado, redirigir a login
    if (!AuthService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    // Si está autenticado, mostrar el componente
    return element;
}
```

### Paso 2: Usar en tus rutas

**File:** `App.jsx`

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta pública */}
                <Route path="/login" element={<Login />} />

                {/* Rutas protegidas */}
                <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
                <Route path="/admin/users" element={<ProtectedRoute element={<AdminUsers />} />} />

                {/* Ruta por defecto */}
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </BrowserRouter>
    );
}
```

---

## 🔒 Vue Router

### Paso 1: Crear guard global

**File:** `router/index.js`

```javascript
import { createRouter, createWebHistory } from 'vue-router';
import AuthService from '../services/AuthService';

import Login from '../pages/Login.vue';
import Dashboard from '../pages/Dashboard.vue';
import Profile from '../pages/Profile.vue';

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresAuth: false }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile,
        meta: { requiresAuth: true }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Guard global - se ejecuta antes de cada navegación
router.beforeEach((to, from, next) => {
    const isAuthenticated = AuthService.isAuthenticated();
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

    if (requiresAuth && !isAuthenticated) {
        // Si requiere auth y NO está autenticado
        next('/login');
    } else if (to.path === '/login' && isAuthenticated) {
        // Si va a login y YA está autenticado
        next('/dashboard');
    } else {
        // Si todo está bien
        next();
    }
});

export default router;
```

### Paso 2: Usar en App.vue

**File:** `App.vue`

```vue
<template>
    <div>
        <Header v-if="isAuthenticated" />
        <router-view />
    </div>
</template>

<script setup>
import { computed } from 'vue';
import AuthService from './services/AuthService';
import Header from './components/Header.vue';

const isAuthenticated = computed(() => AuthService.isAuthenticated());
</script>
```

---

## 🔒 Svelte + SvelteKit

### Paso 1: Crear hook de autenticación

**File:** `src/lib/auth.js`

```javascript
import { writable } from 'svelte/store';
import AuthService from './services/AuthService';

export const user = writable(AuthService.getCurrentUser());
export const isAuthenticated = writable(AuthService.isAuthenticated());

export function login(email, password) {
    return AuthService.login(email, password).then((response) => {
        user.set(response.user);
        isAuthenticated.set(true);
        return response;
    });
}

export function logout() {
    return AuthService.logout().then(() => {
        user.set(null);
        isAuthenticated.set(false);
    });
}
```

### Paso 2: Usar en páginas

**File:** `src/routes/dashboard/+page.svelte`

```svelte
<script>
    import { goto } from '$app/navigation';
    import { isAuthenticated } from '$lib/auth';

    // Si NO está autenticado, redirigir a login
    if (!$isAuthenticated) {
        goto('/login');
    }
</script>

<div>
    <h1>Dashboard</h1>
    <!-- Contenido -->
</div>
```

### Paso 3: Layout protegido

**File:** `src/routes/+layout.svelte`

```svelte
<script>
    import { goto } from '$app/navigation';
    import { isAuthenticated } from '$lib/auth';
    import Header from '$lib/components/Header.svelte';
</script>

{#if $isAuthenticated}
    <Header />
{/if}

<slot />
```

---

## 🔒 Patrón genérico para cualquier framework

### 1. Crear un "Guard" o "Middleware"

```javascript
// Antes de mostrar una página
if (!AuthService.isAuthenticated()) {
    redirigir_a_login();
    return;
}

// Si llegamos aquí, mostrar la página
mostrar_contenido();
```

### 2. Proteger rutas sensibles

```javascript
// Rutas que requieren autenticación
const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/admin',
];

// Verificar antes de navegar
if (protectedRoutes.includes(ruta)) {
    if (!AuthService.isAuthenticated()) {
        ir_a_login();
    }
}
```

---

## 🛡️ Protección por Rol (Solo Admin)

### React

```jsx
import AuthService from '../services/AuthService';
import { Navigate } from 'react-router-dom';

export function AdminRoute({ element }) {
    const user = AuthService.getCurrentUser();

    if (!AuthService.isAuthenticated()) {
        return <Navigate to="/login" />;
    }

    if (user?.role !== 'administrador') {
        return <Navigate to="/dashboard" />;
    }

    return element;
}

// Usar:
<Route path="/admin/users" element={<AdminRoute element={<AdminUsers />} />} />
```

### Vue

```javascript
// En router/index.js
router.beforeEach((to, from, next) => {
    const user = AuthService.getCurrentUser();
    const requiresAdmin = to.meta.requiresAdmin;

    if (requiresAdmin && user?.role !== 'administrador') {
        next('/dashboard');
    } else {
        next();
    }
});

// En rutas:
{
    path: '/admin/users',
    component: AdminUsers,
    meta: { requiresAuth: true, requiresAdmin: true }
}
```

---

## 📝 Ejemplo Completo: Sistema de Login + Rutas Protegidas (React)

**App.jsx**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AuthService from './services/AuthService';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import Header from './components/Header';

function ProtectedRoute({ element }) {
    return AuthService.isAuthenticated() ? element : <Navigate to="/login" />;
}

function AdminRoute({ element }) {
    const user = AuthService.getCurrentUser();
    if (!AuthService.isAuthenticated() || user?.role !== 'administrador') {
        return <Navigate to="/dashboard" />;
    }
    return element;
}

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(AuthService.isAuthenticated());

    useEffect(() => {
        // Escuchar cambios en localStorage
        window.addEventListener('storage', () => {
            setIsLoggedIn(AuthService.isAuthenticated());
        });
    }, []);

    return (
        <BrowserRouter>
            {isLoggedIn && <Header />}
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
                <Route path="/admin/users" element={<AdminRoute element={<AdminUsers />} />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </BrowserRouter>
    );
}
```

**Header.jsx**

```jsx
import { Link } from 'react-router-dom';
import AuthService from '../services/AuthService';

export default function Header() {
    const user = AuthService.getCurrentUser();

    async function handleLogout() {
        await AuthService.logout();
        window.location.href = '/login';
    }

    return (
        <header>
            <nav>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/profile">Perfil</Link>
                {user?.role === 'administrador' && (
                    <Link to="/admin/users">Usuarios</Link>
                )}
                <button onClick={handleLogout}>Logout</button>
            </nav>
        </header>
    );
}
```

---

## ✅ Checklist

- ✅ Crear componente/guard de protección
- ✅ Verificar `AuthService.isAuthenticated()`
- ✅ Redirigir a login si no está autenticado
- ✅ Verificar rol si es necesario (admin)
- ✅ Mostrar Header solo si está autenticado
- ✅ Agregar botón de logout

¡Listo para proteger tus rutas! 🚀
