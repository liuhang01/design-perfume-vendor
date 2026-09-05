# DESIGN PERFUME VENDOR

Static English vendor landing page with:

- FAQ content loaded from configuration
- WhatsApp vendor contact routing
- Server-side round-robin WhatsApp rotation
- TikTok Pixel event hooks (`PageView`, `ViewContent`, `Contact`)
- Protected Cloudflare Worker admin route

## Run On Another Computer

Requirements: Node.js 18+.

```powershell
npm install
npm start
```

Open:

- Landing page: `http://localhost:4174/`
- Local admin preview: `http://localhost:4174/admin.html`

The local server uses `config.json` and the default local admin token `local-preview-token`.

## Cloudflare Deployment

The deployed Worker is configured through `wrangler.toml` and `worker.js`.

Cloudflare runtime secrets must be configured in the Worker dashboard and must not be committed to GitHub:

- `ADMIN_USERNAME` — admin login name, currently `admin`
- `ADMIN_PASSWORD` — the admin password chosen by the owner
- `SESSION_SECRET` — a long random signing secret

The production admin route is intentionally not `/admin`:

`/manage-dpv-7f3a9c2e`

The public Worker URL is set by Cloudflare and may change if the Worker name changes.

## GitHub Source

Repository:

`https://github.com/liuhang01/design-perfume-vendor`

Clone on another computer:

```powershell
git clone https://github.com/liuhang01/design-perfume-vendor.git
cd design-perfume-vendor
```

## Important Security Notes

- Never commit Cloudflare API tokens, admin passwords, session secrets, or TikTok Events API access tokens.
- TikTok Pixel IDs are public browser configuration; Events API access tokens are private server secrets.
- `config.json` is suitable for local development. Production configuration should live in Cloudflare storage/bindings.
- GitHub Pages can host the static page, but cannot run `worker.js`, Durable Objects, or the protected admin API.
