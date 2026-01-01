# Deployment Guide — microretailX

## Archivos ESENCIALES

Necesitas solo estos 5 archivos para estar online profesionalmente:

```
microretailx/
├── index.html          ← Tu web (usa tu index (47).html)
├── _headers            ← Security headers
├── robots.txt          ← SEO
├── sitemap.xml         ← SEO
└── legal/              ← Páginas legales
    ├── terms.html
    ├── privacy.html
    ├── cookies.html
    └── legal.html
```

## OPCIÓN A: Cloudflare Pages (GRATIS, RECOMENDADO)

### Setup (1 vez)

```bash
# 1. Instala Wrangler CLI
npm install -g wrangler

# 2. Login
wrangler login
```

### Deploy

```bash
# Desde el folder de tu proyecto
wrangler pages deploy . --project-name=microlabsx

# O especifica la carpeta
wrangler pages deploy /ruta/a/microretailx/ --project-name=microlabsx
```

### Custom Domain

```bash
# En Cloudflare dashboard:
Pages > microlabsx > Custom domains > Add domain
```

## OPCIÓN B: Netlify (También GRATIS)

```bash
# 1. Instala Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Deploy
netlify deploy --prod
```

## OPCIÓN C: Vercel (También GRATIS)

```bash
# 1. Instala Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod
```

## OPCIÓN D: GitHub Pages (GRATIS pero sin custom headers)

```bash
# 1. Push a GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/microretailx.git
git push -u origin main

# 2. Enable Pages en GitHub Settings
Settings > Pages > Source: main branch
```

**Nota:** GitHub Pages NO soporta `_headers`, así que no tendrás security headers custom.

## LO QUE NO NECESITAS (por ahora)

- ❌ `package.json` (solo si usas npm scripts)
- ❌ `vite.config.js` (solo si usas build process)
- ❌ `sw.js` (service worker, hasta que tengas usuarios)
- ❌ `manifest.json` (PWA, hasta que quieras app móvil)
- ❌ Tests, CI/CD, etc.

## Security Headers Explanation

El archivo `_headers` te da:

- **CSP** — Bloquea XSS attacks
- **HSTS** — Fuerza HTTPS siempre
- **X-Frame-Options** — Previene clickjacking
- **Permissions Policy** — Bloquea APIs innecesarias

**Solo funciona en:**
- ✅ Cloudflare Pages
- ✅ Netlify
- ❌ GitHub Pages (no soporta)
- ❌ Vercel (usa vercel.json)

## Troubleshooting

### Error: "CSP blocking my canvas"

Edita `_headers`, línea CSP:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
```

### Error: "Service worker not loading"

Elimina `sw.js` y referencias en `index.html`:
```html
<!-- Comentar o eliminar -->
<!-- <script>navigator.serviceWorker.register('/sw.js')</script> -->
```

### Error: "Manifest not found"

Elimina referencia en `index.html`:
```html
<!-- Comentar o eliminar -->
<!-- <link rel="manifest" href="/manifest.json"> -->
```

## Quick Start (Copy/Paste)

```bash
# 1. Crea folder
mkdir microretailx
cd microretailx

# 2. Copia tus archivos
cp /ruta/a/index__47_.html index.html

# 3. Crea _headers (copia de la carpeta ultimate)
# 4. Crea robots.txt (copia de la carpeta ultimate)
# 5. Crea sitemap.xml (copia de la carpeta ultimate)

# 6. Deploy
wrangler pages deploy . --project-name=microlabsx
```

**DONE.** Tu web está online en 5 minutos.

## Next Steps (Cuando tengas tiempo)

1. **Custom domain** — Configura microlabsx.com
2. **Analytics** — Añade Cloudflare Analytics (gratis, privacy-first)
3. **Contact form** — Cloudflare Workers para backend
4. **PWA** — Añade manifest.json + sw.js cuando lo necesites

## Support

Si algo falla:
- Cloudflare Docs: https://developers.cloudflare.com/pages
- O pregúntame
