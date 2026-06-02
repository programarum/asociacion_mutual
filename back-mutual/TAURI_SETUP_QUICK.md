# Guía rápida: Conectar Tauri Frontend con Backend Sanctum

## Resumen rápido

Tu backend está en `http://localhost:8000` con rutas API en `/api`

### 1. Instala Axios

```bash
npm install axios
```

### 2. Copia los archivos de configuración

- [resources/js/api.js](./resources/js/api.js) → Tu proyecto Tauri
- [resources/js/services/AuthService.js](./resources/js/services/AuthService.js) → Tu proyecto Tauri

### 3. Usa en tu componente

**Ejemplo en Svelte/React/Vue:**

```javascript
import AuthService from './services/AuthService';

// Login
async function handleLogin(email, password) {
    try {
        const response = await AuthService.login(email, password);
        console.log('Usuario:', response.user);
        // Token se guarda automáticamente en localStorage
    } catch (error) {
        console.error('Error:', error.response?.data);
    }
}

// Verificar si está autenticado
if (AuthService.isAuthenticated()) {
    const user = AuthService.getCurrentUser();
    console.log('Usuario conectado:', user);
}

// Logout
await AuthService.logout();
```

---

## Cambios necesarios en tu backend

### En `config/sanctum.php`

Asegúrate de permitir tu frontend en CORS:

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8000,::1',
    Sanctum::currentApplicationUrlWithPort(),
))),
```

### En `.env`

```
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:5173
SESSION_DOMAIN=localhost
```

---

## Estructura recomendada para tu frontend

```
src/
├── services/
│   ├── api.js              # Configuración axios
│   ├── AuthService.js      # Autenticación
│   └── UserService.js      # Gestión de usuarios (admin)
├── stores/                 # Pinia/Zustand/Context
│   └── authStore.js        # Estado de autenticación
├── components/
│   ├── Login.svelte
│   ├── Register.svelte
│   └── Dashboard.svelte
└── App.svelte
```

---

## Flujo de datos

```
Tauri Frontend
    ↓
Axios interceptor (agrega token)
    ↓
http://localhost:8000/api/login
    ↓
Laravel Backend (Sanctum)
    ↓
Retorna: token + usuario
    ↓
Frontend guarda token en localStorage
    ↓
Peticiones futuras incluyen token automáticamente
```

---

## Errores comunes

### 401 Unauthorized
- Token no incluido o expirado
- `api.js` lo maneja y limpia localStorage

### CORS Error
- Frontend en diferente puerto que backend
- Revisar `config/cors.php` en Laravel

### Token no se envía
- Verificar que el interceptor de request esté correcto
- Revisar en Network del navegador el header `Authorization: Bearer ...`

---

## Testing rápido con curl

```bash
# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Petición con token
curl -X GET http://localhost:8000/api/user \
  -H "Authorization: Bearer TOKEN_AQUI"
```
