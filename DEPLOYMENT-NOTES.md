# Deployment Handoff

## Current Cloudflare Worker

- Public site: `https://design-perfume-vendor.juye2577.workers.dev/`
- Private admin route: `https://design-perfume-vendor.juye2577.workers.dev/manage-dpv-7f3a9c2e`

## API Endpoints

- `GET /api/config` — public-safe landing page configuration
- `POST /api/next-whatsapp` — shared WhatsApp round-robin assignment
- `POST /api/admin/login` — creates a signed HttpOnly admin session
- `GET /api/admin/config` — authenticated configuration read
- `PUT /api/admin/config` — authenticated configuration update

## Required Cloudflare Runtime Secrets

Set these in the Worker runtime settings, not in GitHub:

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<your admin password>
SESSION_SECRET=<long random secret>
```

Optional future secret:

```text
TIKTOK_EVENTS_API_TOKEN=<server-side TikTok Events API token>
```

The TikTok Pixel ID is browser-visible configuration and is not a secret. The Events API token is private and must stay server-side.

## GitHub

Repository: `https://github.com/liuhang01/design-perfume-vendor`

The repository contains the source used by the Cloudflare deployment. Do not commit `.env` files or API tokens.

## Moving To Another Computer

Either extract the ZIP or clone the repository, then run:

```powershell
npm install
npm run check
npm start
```

For local API preview, use `http://localhost:4174/`. For production changes, push to the `main` branch and review the Cloudflare build before publishing.
