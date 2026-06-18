# Plans - Audit Results (Commit: 40143ae)

## Priority & Dependency Order

| # | Plan | Priority | Status | Effort | Dependencies |
|---|------|----------|--------|--------|--------------|
| 001 | Secure Token Storage (httpOnly Cookies + HTTPS) | **P1 - CRITICAL** | completed (frontend) | Medium | Backend: CORS, cookies config |
| 002 | CSP Headers & Backend Role Verification | **P2 - HIGH** | completed (frontend) | Medium | Backend: role middleware |
| 003 | React Query + Pagination Caching | **P3 - MEDIUM** | completed | Medium | None |

## Summary

Three prioritized implementation plans to harden security and improve performance:

### Plan 001: Secure Token Storage (httpOnly Cookies + HTTPS)
**Why**: Token stored in localStorage is vulnerable to XSS attacks. Production deployment requires HTTPS enforcement and httpOnly cookies.  
**Scope**: Update AuthService, axios interceptors, environment config, and backend CORS.  
**Verification**: Manual testing with DevTools (token not accessible via JS), HTTPS redirect on production.  

### Plan 002: CSP Headers & Backend Role Verification  
**Why**: No Content Security Policy headers leaves app vulnerable to XSS and clickjacking. Role verification in client can be bypassed; must trust backend only.  
**Scope**: Add CSP headers via next.config.ts, implement role checks on backend endpoints, update frontend UI to match backend truth.  
**Verification**: CSP headers present in response, admin routes reject non-admin users, UI reflects actual permissions.

### Plan 003: React Query + Pagination Caching
**Why**: Multiple uncoordinated API calls for same data (Sidebar + Dashboard fetch `/asociados` twice). No caching or pagination causes N+1 queries and large payloads.  
**Scope**: Replace axios calls with React Query hooks, implement pagination in backend and frontend, add request deduplication.  
**Verification**: Sidebar and Dashboard share cache, pagination controls work, single API call per session.

---

## Execution Notes

- **Language**: TypeScript + React 19 + Next.js 16.2.6
- **Build command**: `npm run build`
- **Lint command**: `npm run lint`
- **Dev command**: `npm run dev`
- **Test command**: (not present; consider adding)
- **Key directories**: 
  - Frontend: `app/`, `services/`, `hooks/`
  - Backend: `back-mutual/` (Laravel)
- **Repo conventions**:
  - React hooks for state management
  - Axios for HTTP with custom interceptors
  - Tailwind for styling
  - Types exported in service files (e.g., `AuthService.tsx`)

---

## Status Tracking

Mark each plan's status as you execute:
- `not-started` → `in-progress` → `completed` or `blocked`
- Record blockers/questions in plan file under "## Notes" section

---

## Considered and Rejected

(None yet — all audit findings have corresponding plans.)
