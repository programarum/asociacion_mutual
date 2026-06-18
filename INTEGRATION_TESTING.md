# Integration Testing Guide: Frontend-Backend

**Date**: 2026-06-11  
**Target**: Verify all 3 plans work together (security + performance)  
**Environment**: Dev (localhost), then Staging, then Production

---

## 🎯 Testing Objectives

✅ Verify CORS headers allow credentials  
✅ Verify httpOnly cookies are set on login  
✅ Verify token sent automatically (no Authorization header needed)  
✅ Verify non-admin users get 403 on admin endpoints  
✅ Verify React Query deduplicates API calls  
✅ Verify CSP headers block inline scripts  
✅ End-to-end: Login → Fetch data → Access protected routes → Logout  

---

## 📋 Prerequisites

### Backend Must Be Ready
- [ ] CORS configured with `supports_credentials: true`
- [ ] httpOnly cookie set on `/api/login` and `/api/register`
- [ ] Role middleware created and applied to admin routes
- [ ] Test users created (admin + non-admin)
- [ ] Backend running on `http://localhost:8000` (dev)

### Frontend Must Be Running
- [ ] `npm run dev` executed (running on `http://localhost:3000`)
- [ ] `.env.local` configured with `NEXT_PUBLIC_API_URL=http://localhost:8000/api`

### Tools Needed
- Browser DevTools (Chrome/Edge/Firefox)
- `curl` or Postman for HTTP testing
- Terminal/PowerShell

---

## 🚀 Setup Steps

### Step 1: Start Backend (Laravel)

```bash
# Terminal 1: Backend
cd back-mutual
php artisan serve --host=localhost --port=8000
# Or: php artisan tinker (for database checks)
```

**Verify backend is running**:
```bash
curl http://localhost:8000/api/health
# Expected: 200 OK (if health endpoint exists)
# Or at least: Connection OK
```

---

### Step 2: Start Frontend (Next.js)

```bash
# Terminal 2: Frontend
cd front-mutual
npm run dev
# Expected: ▲ Next.js 16.2.6 ready on http://localhost:3000
```

---

### Step 3: Prepare Test Users

**Option A: Via Tinker (Laravel)**
```bash
cd back-mutual
php artisan tinker

# Create admin user
$admin = \App\Models\User::factory()->create([
    'email' => 'admin@test.local',
    'password' => bcrypt('password123'),
    'role' => 'administrador'
]);

# Create normal user
$user = \App\Models\User::factory()->create([
    'email' => 'user@test.local',
    'password' => bcrypt('password123'),
    'role' => 'usuario'
]);

exit
```

**Option B: Via Database Seed**
```bash
cd back-mutual
php artisan tinker
\App\Models\User::factory(10)->create(); # Creates 10 random users
```

---

## 🧪 Test Suite 1: CORS & Credentials

### Test 1.1: CORS Preflight with Credentials

```bash
curl -i -X OPTIONS http://localhost:8000/api/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

**Expected Response Headers**:
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: content-type
Access-Control-Allow-Credentials: true  ← CRITICAL
Access-Control-Max-Age: 86400
```

**If missing `Access-Control-Allow-Credentials`**:
- ❌ CORS not configured correctly
- **Fix**: Backend must set `supports_credentials: true` in `config/cors.php`

---

### Test 1.2: CORS Preflight with Complex Headers

```bash
curl -i -X OPTIONS http://localhost:8000/api/usuarios \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

**Expected**: Same headers as 1.1

---

## 🧪 Test Suite 2: httpOnly Cookie Authentication

### Test 2.1: Login & Capture Cookie

```bash
# Login and save cookies to file
curl -i -c cookies.txt -b cookies.txt -X POST http://localhost:8000/api/login \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.local",
    "password": "password123"
  }'
```

**Expected Response**:
```json
HTTP/1.1 200 OK
Set-Cookie: api_token=eyJ0eXAi...; Path=/; HttpOnly; Secure; SameSite=Strict

{
  "message": "Authenticated",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@test.local",
    "role": "administrador"
  },
  "token": "eyJ0eXAi..."
}
```

**Check cookies file**:
```bash
cat cookies.txt
# Should contain: api_token with httpOnly flag
```

---

### Test 2.2: Use Cookie in Subsequent Requests

```bash
# Request using saved cookies (httpOnly cookie sent automatically)
curl -i -b cookies.txt http://localhost:8000/api/asociados
```

**Expected**:
```
HTTP/1.1 200 OK

{
  "data": [...],
  "pagination": {...}
}
```

**If 401 Unauthorized**:
- ❌ Cookie not being sent by backend
- **Fix**: Backend must set cookie correctly on login

---

### Test 2.3: Verify NO Authorization Header Needed

```bash
# Request WITHOUT token or Authorization header
curl -i -b cookies.txt http://localhost:8000/api/asociados \
  -H "Accept: application/json"
```

**Expected**:
- ✅ 200 OK (authenticated via cookie, not Authorization header)

**If 401 Unauthorized**:
- ❌ Backend not reading cookie from request
- **Fix**: Verify Sanctum/Guard is checking cookies

---

## 🧪 Test Suite 3: Role-Based Access Control (403 Responses)

### Test 3.1: Non-Admin User on Admin Endpoint

```bash
# Login as normal user
curl -i -c cookies_user.txt -b cookies_user.txt -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.local",
    "password": "password123"
  }'

# Try to access admin endpoint (should be 403)
curl -i -b cookies_user.txt http://localhost:8000/api/usuarios
```

**Expected**:
```
HTTP/1.1 403 Forbidden

{
  "message": "Insufficient permissions.",
  "required_role": "administrador",
  "user_role": "usuario"
}
```

**If 200 OK** (shouldn't be):
- ❌ Role middleware not applied to endpoint
- **Fix**: Backend must add `->middleware('role:administrador')` to route

**If 500 Error**:
- ❌ Role middleware not created or syntax error
- **Fix**: Backend must create CheckRole middleware properly

---

### Test 3.2: Admin User on Admin Endpoint

```bash
# Use admin cookies from Test 2.1
curl -i -b cookies.txt http://localhost:8000/api/usuarios
```

**Expected**:
```
HTTP/1.1 200 OK

{
  "data": [
    { "id": 1, "email": "admin@test.local", ... },
    { "id": 2, "email": "user@test.local", ... }
  ]
}
```

**If 403 Forbidden**:
- ❌ Role not set correctly on user
- **Fix**: Backend: verify `User::find($id)->role === 'administrador'`

---

### Test 3.3: Unauthenticated on Protected Endpoint

```bash
# Try without any authentication
curl -i http://localhost:8000/api/usuarios
```

**Expected**:
```
HTTP/1.1 401 Unauthorized

{
  "message": "Unauthenticated"
}
```

---

## 🧪 Test Suite 4: Frontend Integration Tests

### Test 4.1: Login Flow (Browser DevTools)

**Steps**:
1. Open `http://localhost:3000` in browser
2. Open DevTools (F12) → Application tab
3. Go to Cookies section
4. **Before login**: No cookies present

5. Enter credentials: `admin@test.local` / `password123`
6. Click Login

7. **After login**: 
   - ✅ Check Cookies → `api_token` present, marked as `HttpOnly`, `Secure` (if HTTPS)
   - ✅ Check Local Storage → `auth_user` present with user data
   - ✅ Check Local Storage → NO `auth_token` (should not exist)

**If missing `api_token` cookie**:
- ❌ Backend not setting cookie on login
- **Fix**: Backend must add `.cookie('api_token', ...)` to login response

---

### Test 4.2: Token Not Accessible from Console

**Steps**:
1. After login, open DevTools → Console tab
2. Run:
   ```javascript
   localStorage.getItem('auth_token')
   // Expected: null (or undefined)
   
   document.cookie
   // Expected: empty or minimal (httpOnly cookies not visible)
   ```

**If sees token value**:
- ❌ Token stored in localStorage (vulnerable!)
- **Fix**: Frontend should NOT be storing token; already fixed in Plan 001

---

### Test 4.3: API Call Network Tab

**Steps**:
1. After login, open DevTools → Network tab
2. Navigate to `/dashboard/asociados`
3. Observe API calls:

**Expected Network Requests**:
```
GET /api/asociados?page=1&per_page=1
  Status: 200 OK
  Headers:
    - Request: Cookie: api_token=...  (✅ Cookie sent, not Authorization header)
    - Response: No Set-Cookie (unless refresh needed)

Headers → Response Headers:
  - Content-Security-Policy: default-src 'self'; ... ✅
  - X-Frame-Options: DENY ✅
  - Strict-Transport-Security: max-age=31536000 ✅
  - X-XSS-Protection: 1; mode=block ✅
```

**If Authorization header present**:
- ❌ Frontend still sending Authorization header
- **Fix**: Already removed in Plan 001; check `services/api.tsx` interceptor

---

### Test 4.4: React Query Caching

**Steps**:
1. Navigate to `/dashboard`
2. DevTools → Network tab (clear history)
3. Observe: 1 request to `/api/asociados` (Sidebar fetches)
4. Navigate to `/dashboard/asociados` (if separate page)
5. **Expected**: NO additional `/api/asociados` request (uses React Query cache)

**If 2+ requests**:
- ❌ React Query not caching
- **Fix**: Check `app/providers.tsx` has staleTime set correctly

**Verify with React Query DevTools**:
```bash
# Add to app/providers.tsx (dev only):
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// In Providers component, after </QueryClientProvider>:
<ReactQueryDevtools initialIsOpen={false} />
```

Then inspect cache in DevTools.

---

### Test 4.5: Non-Admin Access Denied

**Steps**:
1. Logout from admin account
2. Login as non-admin user: `user@test.local` / `password123`
3. Navigate to `/dashboard/usuarios`

**Expected**:
- ❌ UI should NOT show "Usuarios" button in sidebar (hidden based on client role)
- ✅ If you manually navigate to `/dashboard/usuarios`:
  - API call to `/api/usuarios` fails with 403
  - Error banner appears: "Acceso denegado: No tienes permisos..."

---

### Test 4.6: Logout Clears Storage

**Steps**:
1. After login, note:
   - Local Storage: `auth_user` present
   - Cookies: `api_token` present
2. Click Logout button
3. **After logout**:
   - ✅ Local Storage: `auth_user` removed
   - ✅ Cookies: `api_token` deleted (or has Max-Age=0)
   - ✅ Redirected to `/` (login page)

---

## 🧪 Test Suite 5: CSP Security Headers

### Test 5.1: CSP Headers Present

```bash
curl -i http://localhost:3000 | grep -i "content-security-policy"
```

**Expected**:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; ...
```

---

### Test 5.2: Inline Script Blocked

**Steps**:
1. Open DevTools → Console
2. Run: `eval("console.log('test')")`
3. **Expected**: 
   - ❌ Error in console: "Refused to evaluate script"
   - ✅ CSP blocking unsafe-eval

---

### Test 5.3: External Script Blocked

**Steps**:
1. Open DevTools → Console
2. Inject external script:
   ```javascript
   const script = document.createElement('script');
   script.src = 'https://evil.example.com/malicious.js';
   document.body.appendChild(script);
   ```
3. **Expected**:
   - ❌ Network tab: request blocked or 0 bytes
   - ✅ Console error: "Refused to load script from 'https://evil.example.com'..."

---

## 📊 Comprehensive Checklist

Print and use this checklist:

```markdown
## Integration Test Checklist

### ✅ CORS & Credentials
- [ ] CORS preflight returns `Access-Control-Allow-Credentials: true`
- [ ] Frontend origin in CORS `allowed_origins`
- [ ] Credentials sent in OPTIONS request

### ✅ Authentication (httpOnly Cookies)
- [ ] Login endpoint returns Set-Cookie with `HttpOnly` flag
- [ ] Cookie stored in browser (DevTools → Cookies)
- [ ] Cookie sent automatically on subsequent requests
- [ ] Logout clears/expires cookie
- [ ] Token NOT in localStorage (Plan 001)
- [ ] Token NOT in Authorization header

### ✅ Authorization (Role Verification)
- [ ] Non-admin user gets 403 on `/api/usuarios`
- [ ] Admin user gets 200 on `/api/usuarios`
- [ ] Unauthenticated user gets 401 on protected endpoint
- [ ] Role middleware returns correct error message

### ✅ Security Headers (CSP)
- [ ] CSP header present in response
- [ ] `default-src 'self'` enforced
- [ ] `frame-ancestors 'none'` prevents clickjacking
- [ ] `X-Frame-Options: DENY` set
- [ ] `X-XSS-Protection: 1; mode=block` set
- [ ] Inline scripts blocked

### ✅ React Query Caching (Plan 003)
- [ ] Single `/api/asociados` call on `/dashboard` load
- [ ] Dashboard reuses Sidebar's cached data
- [ ] No duplicate API calls within 5 minutes
- [ ] Cache invalidates after staleTime (5 min)

### ✅ End-to-End Flow
- [ ] Login → Set cookies ✅
- [ ] Fetch data → Uses cookie ✅
- [ ] Access admin page → Non-admin gets 403 ✅
- [ ] Logout → Clear cookies ✅
- [ ] Refresh page → Redirect to login (no auth) ✅

### ✅ Error Handling
- [ ] 401 → Redirect to login ✅
- [ ] 403 → Show "Acceso denegado" banner ✅
- [ ] Network error → Show "No se pudo conectar" banner ✅

### ✅ Performance
- [ ] Page load time < 3s ✅
- [ ] API requests deduplicated ✅
- [ ] React Query cache working ✅
```

---

## 🐛 Troubleshooting

### Issue: 403 CORS Error in Browser Console

```
Access to XMLHttpRequest at 'http://localhost:8000/api/...'
from origin 'http://localhost:3000' has been blocked by CORS policy:
```

**Solutions**:
1. Check backend `config/cors.php`:
   - `allowed_origins` includes `'http://localhost:3000'`
   - `supports_credentials` is `true`
   - `allowed_methods` includes `'POST'`, `'GET'`, etc.

2. Verify preflight response (OPTIONS request):
   ```bash
   curl -i -X OPTIONS http://localhost:8000/api/login \
     -H "Origin: http://localhost:3000"
   ```

3. If still failing, check:
   - Backend CORS middleware is registered
   - No other middleware blocking CORS
   - Backend is actually running

---

### Issue: 401 After Login (Cookie Not Sent)

**Frontend logs 401 immediately after login**

**Solutions**:
1. Verify cookie is set:
   ```bash
   curl -i -c /tmp/cookies.txt -X POST http://localhost:8000/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"...","password":"..."}'
   
   cat /tmp/cookies.txt | grep api_token
   ```

2. Verify frontend sends cookie:
   ```bash
   curl -i -b /tmp/cookies.txt http://localhost:8000/api/test
   ```

3. If frontend sees cookie but backend doesn't:
   - Backend must use `withCredentials: true` (already in Plan 001)
   - Verify axios config in `services/api.tsx`

---

### Issue: Non-Admin Still Access Admin Routes

**Non-admin user somehow accesses `/api/usuarios`**

**Solutions**:
1. Verify middleware applied:
   ```php
   // In routes/api.php, route should have middleware:
   Route::get('/usuarios', [UsersController::class, 'index'])
       ->middleware('role:administrador');
   ```

2. Verify role middleware exists:
   ```bash
   # File should exist:
   ls app/Http/Middleware/CheckRole.php
   ```

3. Verify user role in database:
   ```bash
   php artisan tinker
   \App\Models\User::find(1)->role  # Should be 'administrador' or 'usuario'
   ```

4. Check middleware is registered:
   ```php
   // In bootstrap/app.php:
   $middleware->alias([
       'role' => \App\Http\Middleware\CheckRole::class,
   ]);
   ```

---

### Issue: CSP Blocking Legitimate Resources

**Page looks broken; console has CSP violations**

**Example error**:
```
Refused to load the stylesheet 'https://fonts.googleapis.com/...'
because it violates the following Content Security Policy directive: "default-src 'self'"
```

**Solution**:
1. Identify blocked resource (in console)
2. Add to appropriate CSP directive in `next.config.ts`:
   ```typescript
   // If external stylesheet:
   "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
   
   // If external script:
   "script-src 'self' 'wasm-unsafe-eval' https://trusted-cdn.com"
   ```

3. Rebuild: `npm run build`
4. Restart: `npm run dev`

---

### Issue: React Query Cache Not Working

**Multiple API calls for same endpoint**

**Diagnostics**:
```javascript
// In DevTools console:
// Check React Query DevTools (if installed)

// Or manually check QueryClient:
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
queryClient.getQueryData(['asociados', { page: 1, perPage: 1 }]);
// Should return cached data if in cache
```

**Solutions**:
1. Verify `app/providers.tsx` has QueryClient:
   ```typescript
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 1000 * 60 * 5, // 5 minutes
       },
     },
   });
   ```

2. Verify components use same query key:
   - Both Sidebar and Dashboard should use: `queryKey: ["asociados", { page: 1, perPage: 1 }]`
   - If different keys → separate caches

3. Check Network tab:
   - First load: 1 request
   - Navigate away and back (within 5 min): 0 requests
   - If 2+ requests: staleTime too short or cache not working

---

## 📱 Testing on Different Environments

### Development (localhost)

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Backend cookie should have:
# secure: false (HTTP in dev)
# sameSite: 'Strict'
```

**Test**: All tests above with curl and DevTools

---

### Staging (HTTPS)

```bash
# .env.staging
NEXT_PUBLIC_API_URL=https://api-staging.mutual.example.com/api

# Backend cookie should have:
# secure: true (HTTPS required)
# domain: .mutual.example.com
# sameSite: 'Strict'
```

**Test**:
```bash
# From staging frontend domain
curl -i -c cookies.txt https://api-staging.mutual.example.com/api/login \
  -H "Origin: https://staging.mutual.example.com"
```

---

### Production (HTTPS)

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.mutual.example.com/api

# Backend CORS:
'allowed_origins' => [
    'https://mutual.example.com',
],

# Backend cookie:
# secure: true
# domain: .mutual.example.com
# sameSite: 'Strict'
```

---

## 📊 Test Results Template

```markdown
# Integration Test Results - [Date]

## Environment
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Test User (Admin): admin@test.local / password123
- Test User (Normal): user@test.local / password123

## Test Results

### CORS & Credentials
- [ ] Test 1.1: CORS Preflight ✅/❌
- [ ] Test 1.2: Complex Headers ✅/❌

### httpOnly Cookies
- [ ] Test 2.1: Login & Capture Cookie ✅/❌
- [ ] Test 2.2: Use Cookie in Requests ✅/❌
- [ ] Test 2.3: No Authorization Header ✅/❌

### Role-Based Access
- [ ] Test 3.1: Non-Admin gets 403 ✅/❌
- [ ] Test 3.2: Admin gets 200 ✅/❌
- [ ] Test 3.3: Unauthenticated gets 401 ✅/❌

### Frontend Integration
- [ ] Test 4.1: Login Flow ✅/❌
- [ ] Test 4.2: Token Not in Console ✅/❌
- [ ] Test 4.3: Network Tab Headers ✅/❌
- [ ] Test 4.4: React Query Caching ✅/❌
- [ ] Test 4.5: Non-Admin Access Denied ✅/❌
- [ ] Test 4.6: Logout Clears Storage ✅/❌

### Security Headers
- [ ] Test 5.1: CSP Headers Present ✅/❌
- [ ] Test 5.2: Inline Script Blocked ✅/❌
- [ ] Test 5.3: External Script Blocked ✅/❌

## Issues Found
- Issue #1: [Description]
  - Expected: [X]
  - Got: [Y]
  - Fix: [Z]

## Sign-off
- Frontend Lead: _________________ Date: _______
- Backend Lead: _________________ Date: _______
- QA: _________________ Date: _______

## Ready for Staging? YES / NO
## Ready for Production? YES / NO
```

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅
1. Create PR with all frontend changes
2. Deploy frontend to staging
3. Deploy backend changes to staging
4. Run full end-to-end testing on staging
5. Schedule production deployment

### If Issues Found ❌
1. Document issue in Results Template
2. Identify root cause (frontend vs backend)
3. Create ticket for fixes
4. Re-run affected tests
5. Repeat until all tests pass

---

## 📞 Contact

**Questions about frontend testing?**
- Check Network tab in DevTools
- Review `plans/EXECUTION_SUMMARY.md`

**Questions about backend testing?**
- Check `BACKEND_SETUP_CHECKLIST.md`
- Coordinate with backend team

**Integration not working?**
- Run Troubleshooting section above
- Document issue in Results Template
- Escalate to tech lead
