# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public issue**.  
Send details privately to the project maintainer.

---

## Security Rules for Contributors

### 🔐 Never Commit
- `.env` files (use `.env.example` with placeholder values)
- `*.sql` / `*.dump` database backups
- `*.log` files
- `acme.json` (Traefik TLS certificates)
- `*_rawdata.json` infrastructure data

### 🔑 Secrets Management
- Generate `JWT_SECRET` with at least 64 random bytes:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Rotate `JWT_SECRET` and database passwords periodically in production
- Use **GitHub Actions Secrets** or **Docker Swarm/Kubernetes secrets** for production values — never hardcode them

### 🌐 CORS
- `FRONTEND_URL` in `.env` must be set to your exact production domain
- The backend only allows requests from that origin

### 🛡️ Rate Limiting (already configured)
| Endpoint | Limit |
|---|---|
| Login | 5 attempts / 15 min |
| Forgot password | 5 attempts / 15 min |
| QR scan | 10 scans / 1 min |
| General API | 100 requests / 15 min |

### 📋 Checklist Before Every Deploy
- [ ] `.env` is NOT in git history (`git log --all --full-history -- .env`)
- [ ] `acme.json` permissions are `chmod 600`
- [ ] `JWT_SECRET` is at least 64 chars
- [ ] `FRONTEND_URL` is set correctly for CORS
