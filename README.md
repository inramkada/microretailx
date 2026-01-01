# microretailX — Minimal Deployment

## 📦 Lo que tienes aquí

**5 archivos esenciales** para tu web profesional:

```
microretailx-minimal/
├── index.html              ← Tu web original (con partículas)
├── _headers                ← Security headers (Cloudflare/Netlify)
├── robots.txt              ← SEO
├── sitemap.xml             ← SEO
└── .well-known/
    └── security.txt        ← Vulnerability disclosure
```

## 🚀 Deploy en 2 minutos

### Opción 1: Cloudflare Pages (RECOMENDADO)

```bash
# 1. Instala Wrangler (una sola vez)
npm install -g wrangler

# 2. Login
wrangler login

# 3. Deploy
cd microretailx-minimal
wrangler pages deploy . --project-name=microlabsx
```

**Tu web estará en:** `https://microlabsx.pages.dev`

### Opción 2: Netlify

```bash
# 1. Instala Netlify CLI
npm install -g netlify-cli

# 2. Deploy
cd microretailx-minimal
netlify deploy --prod
```

### Opción 3: Drag & Drop (MÁS FÁCIL)

1. Ve a https://pages.cloudflare.com
2. Arrastra el folder `microretailx-minimal`
3. DONE

## ✅ Lo que tienes

- **Security headers** tier-1 (CSP, HSTS, etc.)
- **SEO** optimizado (robots.txt, sitemap.xml)
- **RFC 9116** compliant (security.txt)
- **Tu animación** de partículas funcionando
- **GDPR** consent management
- **Mobile optimized**
- **Performance optimized**

## ❌ Lo que NO tienes (y no necesitas ahora)

- Service Worker (offline)
- PWA manifest
- Build process
- Tests
- CI/CD

**Podrás añadir esto después cuando lo necesites.**

## 🔧 Customización

### Cambiar domain

En Cloudflare Pages:
```
Settings > Custom domains > Add microlabsx.com
```

### Editar security headers

Edita `_headers` y cambia las políticas.

### Añadir páginas legales

Crea `legal/terms.html`, `legal/privacy.html`, etc.

## 📊 Analytics (Opcional)

### Cloudflare Analytics (Gratis, sin cookies)

```
Cloudflare Dashboard > Analytics > Enable
```

### Google Analytics (si necesitas)

Añade en `index.html` antes de `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Recuerda:** Actualiza tu CSP en `_headers` si usas Google Analytics.

## 🆘 Problemas comunes

### "CSP blocking my scripts"

Edita `_headers`, busca la línea `Content-Security-Policy` y añade dominios permitidos.

### "Particles not showing"

Verifica que tu `index.html` tenga el canvas y el JavaScript al final.

### "Custom domain not working"

En Cloudflare, añade un registro DNS:
```
Type: CNAME
Name: @
Target: microlabsx.pages.dev
```

## 📞 Soporte

Si tienes problemas:
1. Lee la documentación de Cloudflare Pages
2. O pregúntame

---

**Hecho por Claude para Inram — 2026**
