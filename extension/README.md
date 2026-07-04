# AdScout Capture (Chrome extension, v1)

Manual-capture only — no Meta Ad Library scraping. Right-click any ad image (or a page) and save it into your AdScout account via the same API key auth used by `/api/extension/capture`.

## Load it locally

1. Go to `chrome://extensions`, enable Developer mode.
2. Click "Load unpacked" and select this `extension/` folder.
3. Open the extension popup, set **App URL** (e.g. `http://localhost:3000` in dev) and paste an **API key** generated from Settings → Integrations in the app.
4. Right-click any image on the web → "Save ad image to AdScout". A green badge confirms success.

Saved ads land in an auto-created "Extension Saves" collection with `source: manual_capture`.

## Known limitations (v1)

- `host_permissions: ["<all_urls>"]` is intentionally broad to support capturing ads from any site, per the product's "capture from anywhere" goal — narrow this if you only need Meta/TikTok.
- No icon assets yet (`manifest.json` has no `icons` key, so Chrome shows its default placeholder icon).
- Captured text is best-effort (tab title / page URL) — there's no DOM scraping of ad copy yet.
