# Configuration & Tracking Guide

This document describes the site configuration schema, the admin surfaces, and the TikTok pixel/event setup.

## Where configuration lives

- **Local preview** — `config.json`, edited through `http://localhost:4174/admin.html` (token: `local-preview-token`) or by hand.
- **Production (Cloudflare Worker)** — stored in the Worker's Durable Object, edited only through the hidden admin route `/manage-dpv-7f3a9c2e`. The public API strips WhatsApp numbers from `/api/config`.

## Config schema

```jsonc
{
  "tiktokPixelId": "DADABN3C77U70STH52JG",
  "appearance": {
    "backgroundImage": "",            // page background image URL, empty = default color
    "heroImage": ""                   // hero section (avatar/title/description) background image URL
  },
  "contactChannels": [               // contact / social cards (first block of cards)
    {
      "id": "whatsapp",
      "type": "whatsapp",            // whatsapp | tiktok | instagram | facebook | telegram | email | website
      "label": "Vendor WhatsApp Contact",
      "subtitle": "Wholesale support · Direct supplier chat",
      "enabled": true,
      "url": "",                     // direct URL for non-whatsapp types
      "numbers": ["8617..."],        // whatsapp only, server-side round-robin
      "backgroundImage": ""          // optional card background image URL
    }
  ],
  "menuCards": [                     // menu cards between contact channels and FAQ
    {
      "id": "menu-1",
      "label": "Product Catalog",
      "subtitle": "Browse the 2026 fragrance line",
      "url": "https://www.tiktok.com/@dpv",
      "icon": "",                    // optional keyword; auto-detected from the URL when empty
      "backgroundImage": "",         // optional card background image URL
      "enabled": true
    }
  ],
  "faq": [{ "q": "...", "a": "..." }]
}
```

### Icons

Icons and brand colors are assigned automatically:

- Contact channels — by `type`.
- Menu cards — detected from the URL (tiktok.com, instagram.com, facebook.com, t.me, wa.me, mailto:, any https page → `website`), or forced with the `icon` keyword: `tiktok`, `instagram`, `facebook`, `telegram`, `email`, `website`, `shop`, `link`.

## Animations

Cards animate in with a stagger on load, lift on hover, and the avatar floats. All motion is disabled automatically for visitors with `prefers-reduced-motion: reduce`.

## TikTok pixel & events

| Event | Trigger | Parameters |
|---|---|---|
| `PageView` | automatic on pixel load (`ttq.page()`) | — |
| `ViewContent` | landing page load | `content_name`, `content_type=product`, `currency=USD` |
| `Contact` | WhatsApp click (any entry point) | `content_name`, `source`, `event_id` |

- The pixel loads only when `tiktokPixelId` is set in the served config.
- **Server-side Events API (production Worker only):** when the Worker secret `TIKTOK_EVENTS_API_TOKEN` is set, every WhatsApp click is also posted to `https://business-api.tiktok.com/open_api/v1.3/event/track/` with the same `event_id` the browser sends, so web and server events deduplicate. Without the secret the call is skipped entirely.
- To enable it: TikTok Events Manager → pixel → *Implement Events API* → **Generate access token**, then `npx wrangler secret put TIKTOK_EVENTS_API_TOKEN`.

## Production deployment checklist

1. `npx wrangler deploy` (publishes `worker.js` + static assets).
2. Open `https://design-perfume-vendor.juye2577.workers.dev/manage-dpv-7f3a9c2e`, sign in, and re-save the config there (production config lives in the Durable Object — it is **not** copied from `config.json`). Paste the Pixel ID `DADABN3C77U70STH52JG`, background image, channels, and menu cards.
3. Optional: set `TIKTOK_EVENTS_API_TOKEN` (see above), rotate `ADMIN_PASSWORD` / `SESSION_SECRET`.
4. Verify with TikTok *Test events* or the Pixel Helper Chrome extension.

Note: the Cloudflare Pages variant under `functions/` shares the same public API and the same admin page markup (kept in sync with the Worker admin). Production currently uses the Worker (`wrangler.toml`), not Pages.
