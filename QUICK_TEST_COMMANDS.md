# Quick Testing Commands - Copy & Paste Ready

## Setup

```bash
# Terminal 1: Backend
cd back-mutual
php artisan serve --host=localhost --port=8000

# Terminal 2: Frontend
cd front-mutual
npm run dev

# Terminal 3: Testing
cd front-mutual  # or anywhere with curl
```

---

## 1️⃣ CORS Test (Preflight)

```bash
# Test that backend allows requests from localhost:3000
curl -i -X OPTIONS http://localhost:8000/api/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

**Look for**:
```
Access-Control-Allow-Credentials: true  ✓
Access-Control-Allow-Origin: http://localhost:3000  ✓
```

---

## 2️⃣ Login & Get Cookie

```bash
# Save cookies to file
curl -i -c cookies.txt -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.local",
    "password": "password123"
  }'
```

**Look for**:
```
HTTP/1.1 200 OK
Set-Cookie: api_token=eyJ0....; HttpOnly; Secure; SameSite=Strict
```

**Check cookies file**:
```bash
cat cookies.txt
```

---

## 3️⃣ Use Cookie in Request

```bash
# Automatic: curl sends cookies from cookies.txt
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

---

## 4️⃣ Test Non-Admin Access (403)

```bash
# First, login as non-admin user
curl -i -c cookies_user.txt -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.local",
    "password": "password123"
  }'

# Try admin endpoint - should get 403
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

---

## 5️⃣ Test Admin Access (200)

```bash
# Use admin cookies from step 2
curl -i -b cookies.txt http://localhost:8000/api/usuarios
```

**Expected**:
```
HTTP/1.1 200 OK

{
  "data": [
    { "id": 1, "email": "admin@test.local", "role": "administrador" },
    { "id": 2, "email": "user@test.local", "role": "usuario" }
  ]
}
```

---

## 6️⃣ Test Logout (Clear Cookie)

```bash
# Logout
curl -i -b cookies.txt http://localhost:8000/api/logout

# Try to use old cookie - should get 401
curl -i -b cookies.txt http://localhost:8000/api/asociados
```

**Expected**: 
```
First call: 200 OK (logout successful)
Second call: 401 Unauthorized (cookie cleared)
```

---

## 7️⃣ Check CSP Headers (Frontend)

```bash
# Frontend security headers
curl -i http://localhost:3000 | grep -i "content-security-policy\|x-frame\|x-xss"
```

**Expected**:
```
Content-Security-Policy: default-src 'self'; ...
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

---

## 8️⃣ Verify NO Authorization Header (Cookie-based)

```bash
# Check request headers sent by curl
curl -i -b cookies.txt -v http://localhost:8000/api/asociados 2>&1 | grep -i "authorization\|cookie"
```

**Expected**:
```
> Cookie: api_token=...  ✓
> Authorization:         (empty - NOT sent) ✓
```

---

## 9️⃣ Test with Postman/Thunder Client

**POST /api/login**:
```
URL: http://localhost:8000/api/login
Method: POST
Headers:
  Content-Type: application/json
  Origin: http://localhost:3000
Body:
  {
    "email": "admin@test.local",
    "password": "password123"
  }
```

**Then GET /api/asociados**:
```
URL: http://localhost:8000/api/asociados
Method: GET
Cookies: api_token=<from-login-response>
```

Postman automatically saves and sends cookies ✓

---

## 🔟 Frontend Browser Testing Checklist

**After logging in at http://localhost:3000**:

1. Open DevTools (F12) → Application
2. Check **Cookies**:
   - [ ] `api_token` present
   - [ ] HttpOnly ✓
   - [ ] Secure (if HTTPS)
   - [ ] SameSite=Strict ✓

3. Check **Local Storage**:
   - [ ] `auth_user` present (user metadata)
   - [ ] `auth_token` NOT present ✓

4. Check **Network Tab**:
   - [ ] First request to `/api/asociados`
   - [ ] Request headers include `Cookie: api_token=...` ✓
   - [ ] Response headers include CSP, HSTS, etc. ✓
   - [ ] Navigate away and back (within 5 min)
   - [ ] NO additional `/api/asociados` request ✓ (React Query cache)

5. Check **Console**:
   - [ ] Run `localStorage.getItem('auth_token')` → null ✓
   - [ ] Run `document.cookie` → empty/minimal ✓
   - [ ] No CSP violation errors ✓

---

## Shortcut Scripts

**Create `test.sh` for Linux/Mac**:

```bash
#!/bin/bash

echo "=== Testing Backend CORS ==="
curl -i -X OPTIONS http://localhost:8000/api/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" | grep -i "allow-credentials"

echo -e "\n=== Login Test ==="
curl -s -c /tmp/cookies.txt -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local","password":"password123"}' | jq '.user'

echo -e "\n=== Using Cookie ==="
curl -i -b /tmp/cookies.txt http://localhost:8000/api/asociados | head -1

echo -e "\n=== Non-Admin Access Test ==="
curl -s -c /tmp/cookies_user.txt -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.local","password":"password123"}' > /dev/null

curl -i -b /tmp/cookies_user.txt http://localhost:8000/api/usuarios | head -1

echo -e "\n=== CSP Headers ==="
curl -s http://localhost:3000 | grep -i content-security-policy | head -1
```

**Run**: `bash test.sh`

---

## Common Issues & Fixes

| Issue | Command to Check | Fix |
|-------|------------------|-----|
| CORS 403 | `curl ... OPTIONS` | Backend: update `config/cors.php` |
| 401 After Login | `curl -b cookies.txt ...` | Backend: set httpOnly cookie on login |
| 200 instead of 403 | `curl ... /api/usuarios` (non-admin) | Backend: apply role middleware |
| No CSP header | `curl -i http://localhost:3000` | Frontend: rebuild `npm run build` |
| Token in localStorage | DevTools → Local Storage | Frontend: already fixed in Plan 001 |

---

## Test Success Criteria

✅ **All tests pass when**:
1. CORS returns `Allow-Credentials: true`
2. Login sets `api_token` cookie with `HttpOnly`
3. Subsequent requests send cookie (no Authorization header)
4. Non-admin gets 403 on `/api/usuarios`
5. Admin gets 200 on `/api/usuarios`
6. CSP headers present on frontend
7. Logout clears cookie
8. React Query caches API calls (no duplicate requests)

🟢 Ready for staging deployment!

---

## Next Level: Automated Testing

```bash
# Install Newman (Postman CLI)
npm install -g newman

# Export Postman collection
# Import collection in CI/CD
# Run: newman run collection.json --environment env.json
```

---

## Questions?

Check [INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md) for detailed explanations.
