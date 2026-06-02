# Flujo de Autenticación paso a paso

## 🔄 Flujo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO EN NAVEGADOR                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
         ┌────────────────────────────────────┐
         │   Componente Login (React/Vue)    │
         └────────────────────────────────────┘
                            ↓
       ┌──────────────────────────────────────────┐
       │  import AuthService                      │
       │  await AuthService.login(email, password)│
       └──────────────────────────────────────────┘
                            ↓
         ┌────────────────────────────────────┐
         │      api.js (Axios instance)       │
         │  POST /api/login                   │
         └────────────────────────────────────┘
                            ↓
    ┌───────────────────────────────────────────────┐
    │  Backend Laravel (http://localhost:8000)     │
    │  Sanctum valida email + password             │
    └───────────────────────────────────────────────┘
                            ↓
         ┌────────────────────────────────────┐
         │   Respuesta del servidor           │
         │  {token, user, message}            │
         └────────────────────────────────────┘
                            ↓
    ┌────────────────────────────────────────────────────┐
    │ AuthService.login() guarda automáticamente:        │
    │ • localStorage.setItem('auth_token', token)        │
    │ • localStorage.setItem('user', JSON.stringify(...))│
    └────────────────────────────────────────────────────┘
                            ↓
         ┌────────────────────────────────────┐
         │  Redirigir a /dashboard            │
         │  window.location.href = '/dashboard'│
         └────────────────────────────────────┘
```

---

## 1️⃣ PASO 1: Usuario Inicia Sesión

**Archivo:** `Login.jsx` (tu componente)

```jsx
import { useState } from 'react';
import AuthService from '../services/AuthService';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleLogin(e) {
        e.preventDefault();
        
        // Aquí es donde sucede la magia
        try {
            const response = await AuthService.login(email, password);
            console.log('Token:', response.token);
            console.log('Usuario:', response.user);
            // Ir a dashboard
            window.location.href = '/dashboard';
        } catch (error) {
            alert('Email o contraseña incorrectos');
        }
    }

    return (
        <form onSubmit={handleLogin}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit">Iniciar Sesión</button>
        </form>
    );
}
```

---

## 2️⃣ PASO 2: AuthService.login() hace la petición

**Archivo:** `services/AuthService.js` (lo que pasa internamente)

```javascript
login(email, password) {
    // 1. Llamar a api.post() que es axios
    return api.post('/login', {
        email,
        password,
    }).then((response) => {
        // 2. Si la respuesta es correcta
        if (response.data.token) {
            // 3. Guardar token en localStorage
            localStorage.setItem('auth_token', response.data.token);
            // 4. Guardar usuario en localStorage
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        // 5. Retornar la respuesta al componente
        return response.data;
    });
}
```

---

## 3️⃣ PASO 3: api.js intercepta y agrega el token

**Archivo:** `api.js` (interceptor automático)

```javascript
// Cada vez que se hace una petición (GET, POST, PUT, DELETE)
// El interceptor agrega el token automáticamente

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        // Agregar el token al header
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Ejemplo: si haces una petición
// GET /api/users

// Se convierte automáticamente en:
// GET /api/users
// Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4️⃣ PASO 4: Backend recibe la petición

**Servidor Laravel (http://localhost:8000)**

```
Recibe: POST /api/login
Body: {email: "user@example.com", password: "password123"}

Sanctum valida:
✓ Email existe en la base de datos
✓ Contraseña es correcta
✓ Todo está bien

Retorna:
{
    "token": "1|abcdefghijklmnopqrstuvwxyz",
    "user": {
        "id": 1,
        "name": "Juan Pérez",
        "email": "user@example.com",
        "role": "usuario"
    },
    "message": "Sesión iniciada exitosamente"
}
```

---

## 5️⃣ PASO 5: Frontend recibe el token

El componente recibe la respuesta y guarda el token.

```javascript
// Después de hacer login
const user = AuthService.getCurrentUser();
console.log(user);
// Output: { id: 1, name: "Juan Pérez", email: "user@example.com", role: "usuario" }
```

---

## 📋 Peticiones protegidas (con token)

Una vez que el usuario está logueado:

### Hacer petición a ruta protegida

```jsx
// En cualquier componente, hacer petición
import api from '../api';

async function getUsers() {
    try {
        // api.js automáticamente agrega el token
        const response = await api.get('/users');
        console.log(response.data.users);
    } catch (error) {
        console.log('Error:', error);
    }
}
```

### Lo que sucede internamente

```
1. Tu componente llama: api.get('/users')
   ↓
2. Interceptor ve la petición
   ↓
3. Agrega header automáticamente:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ↓
4. Backend recibe:
   GET /api/users
   Header: Authorization: Bearer ...
   ↓
5. Sanctum valida el token
   ✓ Es válido
   ↓
6. Backend retorna los usuarios
   ↓
7. Tu componente recibe la respuesta ✅
```

---

## 🛡️ ¿Qué pasa si el token expira?

```
1. Usuario hace petición: api.get('/users')
   ↓
2. Backend retorna: 401 Unauthorized
   (El token ya no es válido)
   ↓
3. Interceptor de response en api.js detecta 401
   ↓
4. Automáticamente:
   • localStorage.removeItem('auth_token')
   • localStorage.removeItem('user')
   • window.location.href = '/login'
   ↓
5. Usuario redirigido a login ✅
```

---

## 🎯 Checklist: ¿Qué necesito hacer?

### ✅ En tu componente (ej: Login.jsx)

```javascript
import AuthService from '../services/AuthService';

async function handleLogin() {
    try {
        await AuthService.login(email, password);
        // Ir a dashboard
        window.location.href = '/dashboard';
    } catch (error) {
        // Mostrar error
        console.log(error);
    }
}
```

### ✅ En componente protegido (ej: Dashboard.jsx)

```javascript
import AuthService from '../services/AuthService';

if (!AuthService.isAuthenticated()) {
    return <p>Debes iniciar sesión</p>;
}

const user = AuthService.getCurrentUser();
// Mostrar datos del usuario
```

### ✅ En botón de logout (ej: Header.jsx)

```javascript
import AuthService from '../services/AuthService';

async function handleLogout() {
    await AuthService.logout();
    window.location.href = '/login';
}
```

### ❌ NO necesitas hacer más nada

- ✅ El token se envía automáticamente (interceptor)
- ✅ El token se guarda automáticamente (AuthService.login)
- ✅ El token se limpia automáticamente si expira (interceptor response)

---

## 📝 Ejemplo completo: App.jsx

```jsx
import { useState, useEffect } from 'react';
import AuthService from './services/AuthService';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(AuthService.isAuthenticated());

    useEffect(() => {
        // Al cargar, verificar si hay sesión activa
        if (AuthService.isAuthenticated()) {
            setIsLoggedIn(true);
        }
    }, []);

    if (!isLoggedIn) {
        return (
            <Login 
                onLoginSuccess={() => setIsLoggedIn(true)}
            />
        );
    }

    return (
        <Dashboard
            onLogout={() => setIsLoggedIn(false)}
        />
    );
}
```

---

## 🔍 Debugging: Ver qué está en localStorage

Abre la consola del navegador (F12) y escribe:

```javascript
// Ver el token
console.log(localStorage.getItem('auth_token'));

// Ver el usuario
console.log(JSON.parse(localStorage.getItem('user')));

// Ver si está autenticado
console.log(localStorage.getItem('auth_token') !== null);
```

---

## 📊 Resumen rápido

| Acción | Código | Dónde |
|--------|--------|-------|
| **Login** | `await AuthService.login(email, password)` | Componente Login |
| **Verificar si está logueado** | `AuthService.isAuthenticated()` | Cualquier componente |
| **Obtener datos del usuario** | `AuthService.getCurrentUser()` | Cualquier componente |
| **Logout** | `await AuthService.logout()` | Componente Header/Menu |
| **Hacer petición con token** | `await api.get('/users')` | Cualquier componente |
| **Ver token en navegador** | `localStorage.getItem('auth_token')` | Consola F12 |

¡Eso es todo! 🚀
