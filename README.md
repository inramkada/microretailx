# microretailx-site

Static landing with:
- Externalized CSS/JS (CSP-friendly)
- i18n with lazy-loaded JSON locales
- RTL support (Arabic)
- iOS-safe language rail selection
- Minimal CMP that blocks until Accept/Reject/Save
- Consent ID (CID) copy via click

## Run (dev)
```bash
npm i
npm run dev
# http://localhost:5173
```

## Build (minified)
```bash
npm run build
```

Upload the `dist/` folder to your static hosting.

## Recommended security headers (CSP)

If your host supports headers (Netlify/Cloudflare/Nginx), use something like:

Content-Security-Policy:
  default-src 'self';
  base-uri 'none';
  object-src 'none';
  frame-ancestors 'none';
  form-action 'self' mailto:;
  img-src 'self' data:;
  font-src 'self';
  style-src 'self';
  script-src 'self';
  connect-src 'self';
  upgrade-insecure-requests;

Other good headers:
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer
- Permissions-Policy: geolocation=(), microphone=(), camera=()
