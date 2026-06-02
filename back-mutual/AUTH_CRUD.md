# CRUD de Autenticación con Sanctum

## Endpoints disponibles

### 1. Registro (Público)
**POST** `/api/register`

```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Respuesta (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "created_at": "2026-06-02T..."
  },
  "token": "1|token_muy_largo_aqui"
}
```

---

### 2. Login (Público)
**POST** `/api/login`

```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta (200):**
```json
{
  "message": "Sesión iniciada exitosamente",
  "user": {...},
  "token": "1|token_muy_largo_aqui"
}
```

---

### 3. Obtener Usuario Autenticado (Protegido)
**GET** `/api/user`

**Header requerido:**
```
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "user": {...}
}
```

---

### 4. Cerrar Sesión (Protegido)
**POST** `/api/logout`

**Header requerido:**
```
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

---

### 5. Cerrar Todas las Sesiones (Protegido)
**POST** `/api/logout-all`

**Header requerido:**
```
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "message": "Todas las sesiones han sido cerradas"
}
```

---

### 6. Actualizar Perfil (Protegido)
**PUT** `/api/profile`

**Header requerido:**
```
Authorization: Bearer {token}
```

**Cuerpo (opcional):**
```json
{
  "name": "Juan Pablo Pérez",
  "email": "juanpablo@example.com",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
```

**Respuesta (200):**
```json
{
  "message": "Perfil actualizado exitosamente",
  "user": {...}
}
```

---

### 7. Obtener Todos los Usuarios (Solo Administrador)
**GET** `/api/users`

**Header requerido:**
```
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "users": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "administrador",
      "created_at": "2026-06-02T..."
    },
    {
      "id": 2,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "usuario",
      "created_at": "2026-06-02T..."
    }
  ]
}
```

---

### 8. Cambiar Rol de Usuario (Solo Administrador)
**PUT** `/api/users/{id}/role`

**Header requerido:**
```
Authorization: Bearer {token}
```

**Cuerpo:**
```json
{
  "role": "administrador"
}
```

**Respuesta (200):**
```json
{
  "message": "Rol actualizado exitosamente",
  "user": {
    "id": 2,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "administrador",
    "created_at": "2026-06-02T..."
  }
}
```

---

### 9. Eliminar Usuario (Solo Administrador)
**DELETE** `/api/users/{id}`

**Header requerido:**
```
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "message": "Usuario eliminado exitosamente"
}
```

**Nota:** Un administrador no puede eliminar su propia cuenta

---

## Notas importantes

1. **Token**: Guarda el token retornado en login/register en el almacenamiento local del cliente
2. **Authorization Header**: Siempre incluye el token en el header `Authorization: Bearer {token}`
3. **Password**: Las contraseñas se almacenan hasheadas con bcrypt
4. **Validación**: Email debe ser único en la base de datos
5. **Las rutas de Asociados siguen funcionando** sin cambios
6. **Roles**: Por defecto, nuevos usuarios son registrados como `usuario`. Solo `administrador` puede cambiar roles
7. **Roles disponibles**: `administrador`, `usuario`

---

## Flujo típico de uso

1. Usuario hace **POST** `/api/register` → recibe token (rol: usuario)
2. Usuario hace **POST** `/api/login` → recibe token
3. Cliente almacena token
4. Cliente incluye token en Authorization header para requests protegidos
5. Usuario hace **POST** `/api/logout` para cerrar sesión

## Flujo de administración (solo administrador)

1. Administrador hace **GET** `/api/users` → obtiene lista de todos los usuarios
2. Administrador hace **PUT** `/api/users/{id}/role` → cambia el rol de un usuario
3. Administrador hace **DELETE** `/api/users/{id}` → elimina un usuario
