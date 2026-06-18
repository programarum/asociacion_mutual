# Plan 002: CSP Headers & Backend Role Verification

**Commit**: 40143ae  
**Priority**: P2 - HIGH  
**Status**: not-started  
**Effort**: Medium (3–5 hours)  
**Risk of fix**: Low (read-only fixes to headers and verification; no breaking changes if done incrementally)  
**Depends on**: Plan 001 (optional but recommended; independent if needed separately)

---

## Problem Summary

- **Current state 1**: No Content Security Policy (CSP) headers; app vulnerable to XSS and clickjacking.
- **Current state 2**: Role verification happens on frontend; users can modify role in DevTools (localStorage).
- **Finding evidence**: 
  - CSP missing: [next.config.ts](../next.config.ts) (no CSP headers configured)
  - Frontend role check: [useRole.ts](../hooks/useRole.ts#L9)

---

## Solution

1. **Add CSP headers** via Next.js config to prevent inline script injection and restrict resource loading.
2. **Backend role verification**: On all protected endpoints, re-verify user role from database (don't trust client claim).
3. **Frontend updates**: Remove client-side role checks for access control; only use role for UI hints (show/hide buttons).

---

## Implementation Steps

### Step 1: Add CSP Headers to Next.js Config
**Purpose**: Prevent inline script injection and restrict resource sources.

**File**: `next.config.ts`

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'wasm-unsafe-eval'", // wasm-unsafe-eval for Next.js
              "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline (post-4.0 can improve)
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' http://localhost:8000 https://api.mutual.example.com", // API URLs
              "frame-ancestors 'none'", // Prevent clickjacking
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Explanation**:
- `default-src 'self'`: Allow resources from same origin only.
- `script-src 'self' 'wasm-unsafe-eval'`: Next.js needs wasm-unsafe-eval for its runtime.
- `connect-src`: List your API URLs (localhost for dev, production domain for prod).
- `frame-ancestors 'none'`: Prevents your app from being framed by other sites (clickjacking).

**Verification**:
```bash
npm run build
npm run start
curl -i http://localhost:3000 | grep -i "content-security-policy"
# Should see: Content-Security-Policy: default-src 'self'; ...
```

**Expected output**:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; ...
```

---

### Step 2: Test CSP in Development
**Purpose**: Ensure CSP doesn't break app functionality.

**Steps**:
```bash
npm run dev
# Open http://localhost:3000 in DevTools (F12)
# Check Console tab for CSP violations
```

**Expected behavior**:
- No CSP violation errors in console.
- App functions normally.
- If you see `Refused to load script...` errors:
  - Add the source to CSP `script-src` directive.
  - Document in "## Notes" section below.

**Common issues**:
- **Inline `<script>` tags**: CSP blocks them. Move to separate `.js` file.
- **Eval usage**: CSP blocks `eval()`. Use alternatives (e.g., `Function` constructor, but avoid when possible).

**Verification command**:
```bash
# No CSP violations after 30 seconds of interaction
npm run dev &
# Interact with app (login, navigate)
# Kill after testing
```

---

### Step 3: Create Environment-Aware CSP Config
**Purpose**: Different CSP for dev (localhost) vs. production (your domain).

**File**: `next.config.ts` (update previous)

**Replace the `headers()` function with**:
```typescript
async headers() {
  const isDevelopment = process.env.NODE_ENV === "development";
  
  const apiUrl = isDevelopment
    ? "http://localhost:8000"
    : "https://api.mutual.example.com";

  return [
    {
      source: "/:path*",
      headers: [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'wasm-unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            `connect-src 'self' ${apiUrl}`, // Dynamic API URL
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
        // ... other headers from previous step
      ],
    },
  ];
}
```

**Verification**:
```bash
NODE_ENV=development npm run dev
# curl -i http://localhost:3000 | grep connect-src
# Should show: connect-src 'self' http://localhost:8000

NODE_ENV=production npm run build && npm start
# Should show: connect-src 'self' https://api.mutual.example.com
```

---

### Step 4: Backend: Verify Role on Protected Endpoints
**Purpose**: Never trust client's claimed role; always verify on backend.

**Scope**: All protected API endpoints (`/users`, `/asociados`, `/setting`, etc.)

**Example** (Laravel backend pattern):

**File**: `back-mutual/app/Http/Controllers/UsersController.php` (or relevant controller)

**Before**:
```php
public function index()
{
    // ❌ Assuming user is admin without checking
    return User::all();
}
```

**After**:
```php
use Illuminate\Http\Request;

public function index(Request $request)
{
    // ✅ Verify user is admin from database
    if ($request->user()?->role !== 'administrador') {
        return response()->json([
            'message' => 'Unauthorized. Admin role required.',
        ], 403);
    }

    return User::all();
}
```

**Pattern for all protected routes**:

**File**: `back-mutual/routes/api.php`

**Example**:
```php
Route::middleware(['auth:sanctum'])->group(function () {
    // Public endpoints (any authenticated user)
    Route::get('/asociados', [AsociadosController::class, 'index']);
    
    // Admin-only endpoints
    Route::middleware(['role:administrador'])->group(function () {
        Route::post('/usuarios', [UsersController::class, 'store']);
        Route::get('/setting', [SettingController::class, 'show']);
    });
});
```

**Or create a custom middleware** (recommended):

**File**: `back-mutual/app/Http/Middleware/CheckRole.php` (create if not exists)

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $role)
    {
        if ($request->user()?->role !== $role) {
            return response()->json([
                'message' => 'Insufficient permissions.',
            ], 403);
        }

        return $next($request);
    }
}
```

**Register middleware** in `back-mutual/bootstrap/app.php`:
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'role' => \App\Http\Middleware\CheckRole::class,
    ]);
})
```

**Then use in routes**:
```php
Route::post('/usuarios', [UsersController::class, 'store'])
    ->middleware('role:administrador');
```

**Verification** (curl test):
```bash
# As non-admin user, try admin endpoint:
curl -H "Authorization: Bearer <non-admin-token>" \
  http://localhost:8000/api/usuarios
# Should return: 403 Forbidden, "Insufficient permissions"

# As admin user:
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:8000/api/usuarios
# Should return: 200 OK, user list
```

---

### Step 5: Update Frontend to Remove Client-Side Access Control
**Purpose**: UI should reflect actual backend permissions, not claim access.

**File**: `app/components/Sidebar.tsx`

**Current code** (lines 30–50):
```typescript
        {/* Usuarios - Solo Admin */}
        {isAdmin && (
          <Link
            href="/dashboard/usuarios"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-stone-700 transition-colors"
          >
            <UserPlus className="w-5 h-5 shrink-0" />
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-medium">Usuarios</p>
                <p className="text-xs text-stone-400">{asociadosCount} registrados</p>
              </div>
            )}
          </Link>
        )}
```

**Note**: This is actually correct! The frontend just *hides* the button based on client role.

**However, add a comment** for clarity:
```typescript
        {/* Usuarios - Solo Admin (UI hint only; backend verifies actual permissions) */}
        {isAdmin && (
          <Link
            href="/dashboard/usuarios"
            // ...
```

**File**: `app/dashboard/usuarios/page.tsx` (if exists; verify first)

**Pattern** (what NOT to do):
```typescript
// ❌ BAD: Access control on frontend only
export default function UsuariosPage() {
  const { isAdmin } = useRole();
  
  if (!isAdmin) {
    return <div>Access Denied</div>;
  }
  // ...
}
```

**What to do instead**:
```typescript
// ✅ GOOD: Attempt to fetch; let backend deny if unauthorized
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/usuarios")
      .then(res => setUsuarios(res.data))
      .catch(err => {
        if (err.response?.status === 403) {
          setError("No tienes permisos para acceder a esta página.");
        }
        // Backend's 403 is the source of truth
      });
  }, []);

  if (error) return <div>{error}</div>;
  return <div>{/* Show usuarios */}</div>;
}
```

**Verification**:
- Delete `auth_user` from localStorage manually in DevTools.
- Set `localStorage.auth_user = JSON.stringify({role: 'administrador'})` (fake admin).
- Try accessing `/dashboard/usuarios`.
- **Expected**: API call fails with 403 (backend rejects fake token + non-existent auth).

---

### Step 6: Add Role-Based Error Handling
**Purpose**: Show friendly error when user lacks permissions.

**File**: `app/components/ConnectionErrorBanner.tsx`

**Current code**:
```typescript
export default function ConnectionErrorBanner() {
  const [error, setError] = useState<ErrorInfo | null>(null);
  // ...
```

**No changes needed here**, but update the error display to be role-aware:

**File**: `services/api.tsx` (update response interceptor)

**Current code** (lines 17–50):
```typescript
api.interceptors.response.use(
    (response) => response,
    (error) => {
        let errorMessage = "Ha ocurrido un error inesperado.";
        // ...
        } else if (status === 403) {
            errorMessage = "No tiene permisos para esta acción.";
        }
```

**Enhance with**:
```typescript
        } else if (status === 403) {
            errorMessage = "Acceso denegado: No tienes permisos para realizar esta acción.";
            // Optional: Log for security monitoring
            console.warn("[API 403]", error.response?.data?.message);
        }
```

**Verification**:
- Try any admin endpoint as non-admin user.
- Banner shows: "Acceso denegado: No tienes permisos..."

---

### Step 7: Document Backend Role Requirements
**Purpose**: Clear contract between frontend and backend on role enforcement.

**File**: `back-mutual/PROTECTED_ROUTES.md` (update if exists, or create new)

**Content**:
```markdown
# Protected Routes & Role Requirements

## Authorization Strategy

- **Frontend**: Shows/hides UI based on cached `user.role` from localStorage.
- **Backend**: **REQUIRED** to verify role on every protected endpoint via middleware.
- **Trust**: Backend is source of truth. Frontend UI is convenience only.

## Protected Endpoints

### Admin-Only Routes
- `POST /api/usuarios` — Create user (admin only)
- `GET /api/usuarios` — List all users (admin only)
- `PUT /api/usuarios/{id}` — Update user (admin only)
- `DELETE /api/usuarios/{id}` — Delete user (admin only)
- `GET /api/setting` — Settings (admin only)

### Authenticated (Any User)
- `GET /api/asociados` — List asociados (any authenticated user)
- `POST /api/logout` — Logout (any authenticated user)

## Implementation Checklist

- [ ] All endpoints check `$request->user()->role` against database.
- [ ] Return `403 Forbidden` if role mismatch.
- [ ] Do not trust `Authorization` header for role claim.
- [ ] Use middleware: `middleware('role:administrador')`.
- [ ] Test endpoints with non-admin token to confirm 403.

## Examples

See `app/Http/Middleware/CheckRole.php` for implementation.
```

**Verification**:
```bash
# Share this doc with backend team
# Confirm implementation matches spec
```

---

## Test Plan

### Manual Testing

1. **CSP Headers Present**:
   ```bash
   curl -i http://localhost:3000 | grep -i "content-security-policy"
   # Confirm header present
   ```

2. **CSP Doesn't Break App**:
   ```bash
   npm run dev
   # DevTools → Console: No CSP violations
   # App loads and functions normally
   ```

3. **Backend Enforces Role**:
   ```bash
   # As non-admin, try admin endpoint:
   curl -H "Authorization: Bearer $USER_TOKEN" \
     http://localhost:8000/api/usuarios
   # Expect: 403 Forbidden
   ```

4. **Frontend Shows Error**:
   ```bash
   # In app, try to access admin page as non-admin
   # Should show: "Acceso denegado: No tienes permisos..."
   ```

### Automated Testing (if test suite exists)

- Add backend test: `tests/Feature/RoleMiddlewareTest.php`
  ```php
  public function test_non_admin_cannot_access_users_endpoint()
  {
      $user = User::factory()->create(['role' => 'usuario']);
      $response = $this->actingAs($user)->get('/api/usuarios');
      $this->assertEquals(403, $response->status());
  }
  ```

---

## Drift Detection

**Check if these have changed** before executing:
- `next.config.ts` — New config may break CSP setup.
- `back-mutual/routes/api.php` — Endpoints may have shifted.
- `back-mutual/app/Http/Middleware/` — Middleware structure.

**Current state baseline**:
- Front-end commit: 40143ae
- CSP: None
- Backend role verification: Unknown (coordinate with team)

---

## Maintenance Notes

- **Adding new protected endpoints**: Always add role middleware to backend route.
- **Changing role names**: Update both backend middleware and frontend `useRole.ts` hook.
- **CSP violations in future**: Add source to `connect-src`, `script-src`, etc. in `next.config.ts`.
- **Frontend CSP bypass**: Do NOT use `'unsafe-eval'` unless absolutely necessary; refactor code instead.

---

## Escape Hatches

**If CSP breaks app**:
- Check DevTools Console for violations.
- Identify the source (e.g., external script, unsafe inline CSS).
- Add to CSP `connect-src` or `script-src` as needed.
- Test thoroughly after each change.

**If backend doesn't have role middleware**:
- **STOP** and create the middleware (see Step 4).
- Do not proceed with frontend changes until backend enforces.
- This is **security-critical**; skipping defeats the purpose.

**If role claim is incorrect on frontend**:
- Verify backend is sending correct role in auth response.
- Check `localStorage.getItem('auth_user')` in DevTools.
- If mismatch, backend bug (not frontend).

---

## Notes

- [ ] Backend team confirms role middleware is active on all protected routes.
- [ ] Test at least 3 protected routes with non-admin user.
- [ ] Document all admin-only endpoints in `PROTECTED_ROUTES.md`.
- [ ] Plan CSP violation response strategy (what to do if external script needed).
