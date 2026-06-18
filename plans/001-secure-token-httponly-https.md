# Plan 001: Secure Token Storage (httpOnly Cookies + HTTPS)

**Commit**: 40143ae  
**Priority**: P1 - CRITICAL (Production blocker)  
**Status**: not-started  
**Effort**: Medium (4–6 hours)  
**Risk of fix**: Medium (auth flow changes; needs backend coordination)

---

## Problem Summary

- **Current state**: JWT token stored in `localStorage` (accessible to JavaScript).
- **Vulnerability**: Any XSS attack can steal the token; no httpOnly protection.
- **Production impact**: Credentials transmitted over HTTP in non-dev environments.
- **Finding evidence**: [AuthService.tsx:44-47](../services/AuthService.tsx#L44-L47), [api.tsx:2](../services/api.tsx#L2)

---

## Solution

Replace `localStorage` token storage with **httpOnly, Secure, SameSite cookies** managed by the backend. Remove token from frontend storage. Enforce HTTPS in production.

---

## Implementation Steps

### Step 1: Update Frontend Environment Config
**Purpose**: Support environment-aware API baseURL (http for dev, https for prod).

**File**: `services/api.tsx`

**Current code** (lines 1–6):
```typescript
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api",
    timeout: 10000, // 10 segundos de timeout
});
```

**Replace with**:
```typescript
import axios from "axios";

const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    // Server-side: use env or fallback
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  }
  // Client-side: use env variable
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
};

const api = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 10000,
    withCredentials: true, // Enable sending cookies with every request
});
```

**Verification**:
```bash
# Dev (should use localhost)
NEXT_PUBLIC_API_URL=http://localhost:8000/api npm run dev

# Test with curl: cookies should be sent
curl -v http://localhost:3000/dashboard 2>&1 | grep -i "cookie"
```

**Expected output**: Request headers include `Cookie:` if authenticated.

---

### Step 2: Remove Token from AuthService
**Purpose**: Stop storing token in localStorage. Backend will handle cookies.

**File**: `services/AuthService.tsx`

**Current code** (lines 35–46):
```typescript
    /**
     * Registrar un nuevo usuario
     * POST /api/register
     */
    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/register", data);

        // Guardar token y usuario en localStorage
        localStorage.setItem(TOKEN_KEY, response.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

        return response.data;
    },
```

**Replace with**:
```typescript
    /**
     * Registrar un nuevo usuario
     * POST /api/register
     * Backend sets httpOnly cookie; frontend only stores user metadata
     */
    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/register", data);

        // Only store user metadata; token stored in httpOnly cookie by backend
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

        return response.data;
    },
```

**Also update** the `login` method (lines 48–55), same change:
```typescript
    /**
     * Iniciar sesión
     * POST /api/login
     * Backend sets httpOnly cookie; frontend only stores user metadata
     */
    async login(data: LoginData): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>("/login", data);

        // Only store user metadata; token stored in httpOnly cookie by backend
        localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));

        return response.data;
    },
```

**Verification**:
- In DevTools → Application → Local Storage: no `auth_token` key after login.
- In DevTools → Application → Cookies: `api_token` (or similar) cookie present, marked as `HttpOnly`.

---

### Step 3: Update isAuthenticated() to Check Cookie Presence
**Purpose**: Verify authentication via backend instead of checking localStorage token.

**File**: `services/AuthService.tsx`

**Current code** (lines 87–91):
```typescript
    /**
     * Verificar si el usuario está autenticado
     * Comprueba que exista un token en localStorage
     */
    isAuthenticated(): boolean {
        return !!localStorage.getItem(TOKEN_KEY);
    },
```

**Replace with**:
```typescript
    /**
     * Verificar si el usuario está autenticado
     * Checks presence of user metadata in localStorage.
     * True auth verification happens on backend via cookie.
     */
    isAuthenticated(): boolean {
        return !!localStorage.getItem(USER_KEY);
    },
```

**Verification**:
```bash
# After logout, localStorage should be empty
# After login, localStorage should have USER_KEY only
```

---

### Step 4: Update Logout to Clear Only localStorage
**Purpose**: Backend cookie is cleared by server; frontend only clears its cache.

**File**: `services/AuthService.tsx`

**Current code** (lines 59–67):
```typescript
    /**
     * Cerrar sesión
     * POST /api/logout (protegido)
     */
    async logout(): Promise<void> {
        try {
            await api.post("/logout");
        } finally {
            // Siempre limpiar localStorage, incluso si el servidor falla
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        }
    },
```

**Replace with**:
```typescript
    /**
     * Cerrar sesión
     * POST /api/logout (protected)
     * Backend clears httpOnly cookie; frontend clears user cache.
     */
    async logout(): Promise<void> {
        try {
            await api.post("/logout");
        } finally {
            // Backend clears cookie; frontend clears user metadata only
            localStorage.removeItem(USER_KEY);
        }
    },
```

**Verification**:
```bash
# After logout, check DevTools → Cookies
# Cookie should be deleted (or have Max-Age=0)
```

---

### Step 5: Remove TOKEN_KEY Constant
**Purpose**: Clean up unused variable.

**File**: `services/AuthService.tsx`

**Current code** (lines 24–25):
```typescript
// Claves de localStorage
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
```

**Replace with**:
```typescript
// Claves de localStorage
const USER_KEY = "auth_user";
```

**Verification**: Linter should have no unused variable warnings.

---

### Step 6: Create .env.example for Frontend Config
**Purpose**: Document required environment variables.

**File**: `.env.example` (create new)

**Content**:
```bash
# Backend API configuration
# Dev: http://localhost:8000/api
# Prod: https://api.mutual.example.com/api
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**Verification**:
```bash
cp .env.example .env.local
# Update NEXT_PUBLIC_API_URL as needed
npm run dev
```

---

### Step 7: Update Backend CORS to Accept Credentials
**Purpose**: Allow browser to send cookies with cross-origin requests.

**File**: `back-mutual/config/cors.php`

**Expected current state** (laravel CORS config):
```php
'allowed_origins' => ['*'],
'allowed_origins_patterns' => [],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => false,  // ← Change this
```

**Action**: Verify with backend team:
- `supports_credentials` must be `true`
- `allowed_origins` should NOT be `['*']` when credentials are enabled (use specific URLs)
- Example safe config:
  ```php
  'allowed_origins' => [
      'http://localhost:3000',       // Dev
      'https://mutual.example.com',  // Prod
  ],
  'supports_credentials' => true,
  ```

**Verification** (after backend change):
```bash
curl -i -X OPTIONS http://localhost:8000/api/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
  
# Should include: Access-Control-Allow-Credentials: true
```

---

### Step 8: Backend Must Set httpOnly Cookie on Login
**Purpose**: Backend responsibility to set secure cookie on auth endpoints.

**Backend checklist** (coordinate with Laravel team):

**On `/api/register` and `/api/login` endpoints**, after token generation:
```php
// Example Laravel code (pseudocode)
$token = $user->createToken('API Token')->plainTextToken;

// Set httpOnly cookie
return response()->json([
    'message' => 'Authenticated',
    'user' => $user,
    'token' => $token // Send in response body for initial handshake
])
->cookie('api_token', $token, $minutes = 60*24, $path = '/', $domain = null, true, true)
// Parameters: name, value, minutes, path, domain, secure, httpOnly
```

**Cookie settings**:
- `httpOnly: true` (not accessible from JavaScript)
- `Secure: true` (HTTPS only in production)
- `SameSite: Strict` (prevent CSRF)
- `Max-Age: 1440` (24 hours or adjust as needed)

**On `/api/logout` endpoint**:
```php
// Clear cookie by setting Max-Age=0
return response()->json(['message' => 'Logged out'])
    ->cookie('api_token', '', $minutes = 0);
```

**Verification**: Coordinate with backend; confirm cookies appear in browser DevTools after login.

---

### Step 9: Update Interceptor to Use Credential Cookies
**File**: `services/api.tsx` (update request interceptor)

**Current code** (lines 9–15):
```typescript
// Interceptor: agregar token a requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

**Replace with**:
```typescript
// Interceptor: cookies are sent automatically via withCredentials
// No need to manually add token to headers
api.interceptors.request.use((config) => {
    // Token is now in httpOnly cookie, sent automatically by browser
    // No action needed here; axios will include it due to withCredentials: true
    return config;
});
```

**Verification**: No Authorization header should appear in DevTools Network tab (token is in cookie, not header).

---

### Step 10: Production Environment Setup
**Purpose**: Ensure HTTPS and secure cookie settings in production.

**File**: `next.config.ts` (add security headers)

**Current code**:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

**Replace with**:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enforce HTTPS in production
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "x-forwarded-proto",
            value: "http", // If behind proxy
          },
        ],
        destination: "https://:host/:path*",
        permanent: true,
      },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains", // 1 year HTTPS
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Verification**:
```bash
npm run build
npm run start
curl -i https://mutual.example.com/ | grep -i "strict-transport"
# Should see: Strict-Transport-Security: max-age=31536000
```

---

## Test Plan

### Manual Testing (Dev Environment)

1. **Login flow**:
   ```bash
   npm run dev
   # Open http://localhost:3000
   # Login with credentials
   # DevTools → Application → Storage:
   #   - Local Storage: no "auth_token" key
   #   - Cookies: "api_token" (or configured name) present, HttpOnly checked
   ```

2. **Token not accessible from console**:
   ```javascript
   // In DevTools Console:
   localStorage.getItem('auth_token')  // null
   document.cookie  // empty (httpOnly blocks access)
   ```

3. **Logout clears storage**:
   ```bash
   # Click Logout
   # DevTools → Cookies: "api_token" deleted or has Max-Age=0
   # Local Storage: "auth_user" removed
   ```

4. **Cookie sent with requests**:
   ```bash
   # DevTools → Network → any API request
   # Headers tab: "Cookie:" present (value hidden due to httpOnly)
   # No "Authorization: Bearer" header
   ```

### Automated Testing (if test suite exists)

- Add test: `services/__tests__/AuthService.spec.ts`
  ```typescript
  describe('AuthService', () => {
    it('should not store token in localStorage after login', async () => {
      // Mock login response
      // Assert: localStorage.getItem('auth_token') === null
      // Assert: localStorage.getItem('auth_user') !== null
    });
  });
  ```

---

## Drift Detection

**Before executing this plan, run**:
```bash
cd back-mutual && git log --oneline -5
cd ../front-mutual && git log --oneline -5
```

**If these files have changed significantly**, re-read and adjust:
- `services/AuthService.tsx` — auth flow structure
- `services/api.tsx` — axios config
- `back-mutual/config/cors.php` — CORS settings
- Backend auth controllers — token generation logic

**Current state baseline**:
- Front-end commit: 40143ae
- Token storage: localStorage
- API URL: hardcoded http://localhost:8000/api
- Backend CORS: not verified (coordinate with team)

---

## Maintenance Notes

- **Future changes to auth flow**: Always ensure httpOnly flag is set on backend cookie.
- **Adding new API endpoints**: They automatically receive cookie via `withCredentials: true`; no per-endpoint config needed.
- **Environment variable updates**: Update `.env.local` and `.env.example` in parallel.
- **Backend Sanctum config**: If using Laravel Sanctum, verify `sanctum.stateful_domains` includes all frontend domains.

---

## Escape Hatches

**If backend cannot set httpOnly cookies** (due to legacy constraints):
- **STOP** and open a backend ticket to enable Sanctum or similar cookie-based auth.
- Alternatives are incomplete (e.g., sending token in Authorization header still requires storage; XSS risk remains).
- This fix is **not optional** for production.

**If CORS errors appear after changes**:
- Check backend `cors.php`: `supports_credentials` must be `true`.
- Check `allowed_origins`: cannot be `['*']` when credentials enabled.
- Update to specific frontend URLs.

**If cookies not sent to API**:
- Verify `withCredentials: true` in axios config (Step 1).
- Verify backend cookie domain matches request domain.
- Check browser console for Mixed Content warnings (http/https mismatch).

---

## Notes

- [ ] Backend team confirms httpOnly cookie support before starting.
- [ ] Test logout flow thoroughly (cookie deletion edge case).
- [ ] Plan HTTPS migration after this is completed (or do simultaneously in staging).
