# Guía Práctica: Cómo usar AuthService.js

## 📌 Lo básico

AuthService es un archivo con **funciones útiles** para autenticación. Solo debes **importarlo** y **usarlo** en tus componentes.

---

## ✅ Ejemplo 1: Login simple

### Paso 1: Importar en tu componente

```javascript
import AuthService from '../services/AuthService';
```

### Paso 2: Crear formulario y usar AuthService.login()

```jsx
// Componente React
import { useState } from 'react';
import AuthService from '../services/AuthService';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    async function handleLogin(e) {
        e.preventDefault();
        
        try {
            // Llamar a AuthService.login()
            const response = await AuthService.login(email, password);
            
            // Si llegamos aquí, el login fue exitoso
            console.log('✅ Login exitoso');
            console.log('Usuario:', response.user);
            console.log('Token guardado en localStorage');
            
            // Redirigir al dashboard
            window.location.href = '/dashboard';
            
        } catch (error) {
            // Si hay error, mostrarlo
            console.log('❌ Error en login');
            const errorMsg = error.response?.data?.message || 'Error al iniciar sesión';
            setError(errorMsg);
        }
    }

    return (
        <form onSubmit={handleLogin}>
            <h2>Iniciar Sesión</h2>
            
            {error && <div style={{color: 'red'}}>{error}</div>}
            
            <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            
            <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            
            <button type="submit">Iniciar Sesión</button>
        </form>
    );
}
```

---

## ✅ Ejemplo 2: Verificar si usuario está logueado

```jsx
import AuthService from '../services/AuthService';

export default function Dashboard() {
    // Al cargar el componente, verificar si está autenticado
    if (!AuthService.isAuthenticated()) {
        return <p>Debes estar logueado para ver esto</p>;
    }

    // Obtener datos del usuario
    const user = AuthService.getCurrentUser();

    return (
        <div>
            <h1>Bienvenido, {user.name}!</h1>
            <p>Email: {user.email}</p>
            <p>Rol: {user.role}</p>
        </div>
    );
}
```

---

## ✅ Ejemplo 3: Logout (Cerrar sesión)

```jsx
import AuthService from '../services/AuthService';

export default function Header() {
    async function handleLogout() {
        try {
            await AuthService.logout();
            console.log('✅ Sesión cerrada');
            // Token y usuario se eliminan automáticamente
            window.location.href = '/login';
        } catch (error) {
            console.log('❌ Error:', error);
        }
    }

    return (
        <button onClick={handleLogout}>
            Cerrar Sesión
        </button>
    );
}
```

---

## ✅ Ejemplo 4: Registro de nuevo usuario

```jsx
import { useState } from 'react';
import AuthService from '../services/AuthService';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        passwordConfirmation: ''
    });
    const [error, setError] = useState('');

    async function handleRegister(e) {
        e.preventDefault();

        try {
            const response = await AuthService.register(
                formData.name,
                formData.email,
                formData.password,
                formData.passwordConfirmation
            );

            console.log('✅ Registro exitoso');
            console.log('Usuario:', response.user);
            // Token se guarda automáticamente
            window.location.href = '/dashboard';

        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Error en el registro';
            setError(errorMsg);
        }
    }

    return (
        <form onSubmit={handleRegister}>
            <h2>Registrarse</h2>
            
            {error && <div style={{color: 'red'}}>{error}</div>}
            
            <input
                type="text"
                placeholder="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
            />
            
            <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
            />
            
            <input
                type="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
            />
            
            <input
                type="password"
                placeholder="Confirmar Contraseña"
                value={formData.passwordConfirmation}
                onChange={(e) => setFormData({...formData, passwordConfirmation: e.target.value})}
                required
            />
            
            <button type="submit">Registrarse</button>
        </form>
    );
}
```

---

## ✅ Ejemplo 5: Actualizar perfil

```jsx
import { useState } from 'react';
import AuthService from '../services/AuthService';

export default function EditProfile() {
    const user = AuthService.getCurrentUser();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [message, setMessage] = useState('');

    async function handleUpdate(e) {
        e.preventDefault();

        try {
            const response = await AuthService.updateProfile(name, email);
            setMessage('✅ Perfil actualizado');
            console.log('Usuario actualizado:', response.user);
        } catch (error) {
            setMessage('❌ Error: ' + error.response?.data?.message);
        }
    }

    return (
        <form onSubmit={handleUpdate}>
            <h2>Editar Perfil</h2>
            
            {message && <p>{message}</p>}
            
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre"
            />
            
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
            />
            
            <button type="submit">Guardar Cambios</button>
        </form>
    );
}
```

---

## 📊 Resumen de métodos

| Método | Qué hace | Retorna | Usa cuando |
|--------|----------|---------|-----------|
| `login(email, password)` | Inicia sesión | `{user, token, message}` | Usuario hace login |
| `register(name, email, pass, confirm)` | Crea usuario nuevo | `{user, token, message}` | Usuario se registra |
| `logout()` | Cierra sesión | `{message}` | Usuario quiere salir |
| `logoutAll()` | Cierra todas las sesiones | `{message}` | Cerrar todas las ventanas |
| `getCurrentUser()` | Obtiene usuario guardado | `{id, name, email, role}` | Mostrar datos del usuario |
| `isAuthenticated()` | ¿Está logueado? | `true` o `false` | Verificar si hay sesión |
| `getUser()` | Obtiene usuario del servidor | `{id, name, email, role}` | Verificar datos actuales |
| `updateProfile(name, email, password)` | Actualiza perfil | `{user, message}` | Usuario edita su perfil |

---

## 🔑 Lo más importante

### El Token se guarda automáticamente
```javascript
// Cuando haces login o register
await AuthService.login(email, password);
// El token se guarda automáticamente en localStorage ✅
```

### El Token se envía automáticamente
```javascript
// En api.js hay un interceptor que agrega el token
// a TODAS las peticiones automáticamente
// No necesitas hacer nada, solo importar AuthService ✅
```

### Ejemplo de flujo completo

```jsx
import { useState } from 'react';
import AuthService from '../services/AuthService';

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(AuthService.isAuthenticated());

    async function handleLogin() {
        try {
            await AuthService.login('user@example.com', 'password123');
            setIsLoggedIn(true); // ✅ Usuario logueado
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function handleLogout() {
        try {
            await AuthService.logout();
            setIsLoggedIn(false); // ✅ Usuario deslogueado
        } catch (error) {
            console.error('Error:', error);
        }
    }

    return (
        <div>
            {!isLoggedIn ? (
                <button onClick={handleLogin}>Iniciar Sesión</button>
            ) : (
                <>
                    <p>Bienvenido, {AuthService.getCurrentUser()?.name}</p>
                    <button onClick={handleLogout}>Cerrar Sesión</button>
                </>
            )}
        </div>
    );
}
```

---

## 🚨 Errores comunes

### ❌ No importar AuthService
```javascript
// MALO - No funciona
login();

// BUENO - Importar primero
import AuthService from '../services/AuthService';
await AuthService.login(email, password);
```

### ❌ No esperar la promesa
```javascript
// MALO - No espera la respuesta
AuthService.login(email, password);
console.log(AuthService.getCurrentUser()); // undefined

// BUENO - Esperar con await
await AuthService.login(email, password);
console.log(AuthService.getCurrentUser()); // {id, name, email, ...}
```

### ❌ No usar try/catch
```javascript
// MALO - Si hay error, se rompe la aplicación
const response = await AuthService.login(email, password);

// BUENO - Capturar errores
try {
    const response = await AuthService.login(email, password);
} catch (error) {
    console.log('Error:', error.response?.data?.message);
}
```

---

## 📝 Template listo para copiar

```jsx
import { useState } from 'react';
import AuthService from '../services/AuthService';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Llamar a AuthService.login
            const response = await AuthService.login(email, password);

            // 2. Si funciona, hacer algo (ej: ir a dashboard)
            console.log('✅ Login exitoso');
            window.location.href = '/dashboard';

        } catch (error) {
            // 3. Si hay error, mostrar mensaje
            const msg = error.response?.data?.message || 'Error desconocido';
            setError(msg);
            console.error('❌ Error:', error);

        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h1>Login</h1>
            
            {error && <div style={{background: '#ffebee', padding: '10px', color: 'red'}}>{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>Contraseña:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Cargando...' : 'Iniciar Sesión'}
                </button>
            </form>
        </div>
    );
}
```

Copia esto, cambia los estilos, y listo! 🚀
