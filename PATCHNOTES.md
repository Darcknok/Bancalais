# Patch Notes

## v1.1.0 — Security Audit & Critical Fixes (2026-07-17)

### Audit
Full security audit performed by 5 audit agents (auth, database, frontend, scraping, infrastructure) followed by a team of 3 developers + 1 inspector.

**52 vulnerabilities identified → 19 critical/high/medium fixes applied.**

---

### Authentication Security

| Severity | Fix |
|----------|-----|
| **Critical** | Self-registration: `admin` role removed from allowed roles. Only `swimmer` and `coach` are accepted. |
| **High** | JWT: algorithm locked to `HS256` (prevents `alg:none` attack). |
| **High** | JWT: lifetime reduced from 30 days to 1 hour. Refresh tokens added (30 days) with `/api/auth/refresh` endpoint. |
| **High** | Login: unified error messages (`"Invalid credentials"`) to prevent account enumeration. |
| **Medium** | JWT sub: `NaN` validation added after `parseInt` to prevent requests with invalid userId. |

### Password Security

| Severity | Fix |
|----------|-----|
| **High** | Strengthened policy: minimum 8 characters, 1 uppercase letter, 1 digit (enforced on both client AND server). |

### Routes & Permissions Security

| Severity | Fix |
|----------|-----|
| **Critical** | `race_feedback`: swimmers can only create/read their own feedback (`nageur_iuf === userId` check). |
| **High** | System notifications: restricted to admins only. |
| **High** | Notifications: `club_id` forced to caller's club for coaches (prevents cross-club impersonation). |
| **High** | Notifications: club scoping on read/delete (IDOR fixed). |
| **High** | System notification deletion: restricted to sender or admin only. |
| **High** | Admin PATCH: role values validated (`swimmer/coach/admin`) + coaches cannot promote to admin. |
| **High** | Admin: coaches can only view/modify users from their own club. |
| **Medium** | LiveFFN: numeric IDs validated (0–10M range) on all endpoints. |

### Network & Infrastructure Security

| Severity | Fix |
|----------|-----|
| **Critical** | HTTPS enforced in production (`__DEV__ ? 'http' : 'https'`). |
| **Critical** | Android: `usesCleartextTraffic` disabled (3 mechanisms fixed). |
| **High** | CORS: `null` origin rejected in production. |
| **Medium** | Rate limiting added: login (10/15min), register (5/h), LiveFFN (30/min). Trust proxy configured. |
| **Medium** | LiveFFN errors: generic messages returned to client (no more internal info leaks). |

### Encoding & Data Fixes

| Severity | Fix |
|----------|-----|
| **High** | Fetcher: automatic charset detection from `Content-Type` header (UTF-8 by default instead of ISO-8859-1). Accented characters in events (e.g. "séries") now display correctly. |
| **High** | Persistence: `ensureCompetitionExists()` called before saving events (FK constraint fixed). |

### Frontend

| Fix |
|-----|
| Refresh token: full flow (storage, automatic 401 retry, logout cleanup). |
| Password policy: client-side regex synced with server. |
| Protocol: production forces HTTPS, development allows HTTP. |

---

### Modified Files
`app.json`, `plugins/with-android-cleartext.js`, `src/lib/api.ts`, `src/context/auth.tsx`, `backend/src/index.ts`, `backend/src/middleware/auth.ts`, `backend/src/routes/auth.ts`, `backend/src/routes/admin.ts`, `backend/src/routes/feedback.ts`, `backend/src/routes/notifications.ts`, `backend/src/liveffn/fetcher.ts`, `backend/src/liveffn/persistence.ts`, `backend/src/liveffn/routes.ts`

### Notes
- JWT and Supabase keys in `backend/.env` should be rotated if the repo was ever publicly accessible.
- Refresh tokens have no server-side revocation (requires Redis/blocklist for full implementation).
- Rate limiter is in-memory (single-instance only).
