<div align="center">

<img src="public/images/landing.png" alt="MundoBL" width="360" />

# MundoBL

**Catálogo curado de series asiáticas BL/GL** (Boys' Love / Girls' Love) y otros géneros —
descubrí, calificá y seguí series tailandesas, coreanas, japonesas y más.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io)
[![i18n](https://img.shields.io/badge/i18n-10%20idiomas-informational)](context.md)

**[mundobl.com.ar](https://mundobl.com.ar)**

</div>

---

## Qué es MundoBL

Un catálogo personal de series asiáticas curado a mano, con calificación por categorías,
seguimiento de progreso, reseñas de la comunidad y un modo "Ver" que reúne contenido
embebido de canales oficiales de YouTube/Vimeo — todo pensado para quien recién arranca
con el género tanto como para quien ya vive en él.

## Features

- 📚 **Catálogo curado** — fichas completas por serie/temporada/episodio, con reparto,
  productoras, universos compartidos y calificación por categorías (trama, casting,
  química, BSO, y más).
- ▶️ **`/ver`** — un Streaming Hub con contenido embebido de canales oficiales
  (YouTube/Vimeo/Bilibili/Dailymotion), con detección de bloqueo regional.
- 🌏 **Glosario Cultural** — honoríficos, tropes y jerga BL/GL explicados, con trivia y
  contribuciones moderadas de la comunidad.
- 🤝 **Colaboradores externos** — productoras y proveedores de contenido pueden cargar y
  gestionar su propio catálogo sin tocar la curaduría principal.
- 💬 **Comunidad** — reseñas, comentarios, favoritos, notas privadas y un sistema de
  logros derivado de tu actividad real.
- 🌐 **10 idiomas** — es, en, it, de, fr, ja, ko, zh-CN, zh-TW, th.

## Quick start

```bash
npm install
npm run local:dev    # levanta Postgres local (Docker) + corre migraciones + npm run dev
# o, si ya tenés la DB local arriba:
npm run dev           # http://localhost:3000
```

```bash
npm run build         # build de producción
npm run lint:fix      # eslint + fix
npm run type-check    # tsc --noEmit
```

## Documentación

| Qué buscás | Dónde está |
|---|---|
| Arquitectura, stack, convenciones, integraciones externas | [`context.md`](context.md) |
| Historial de versiones | [`CHANGELOG.md`](CHANGELOG.md) (también en [/novedades](https://mundobl.com.ar/novedades)) |
| Instrucciones para agentes de IA | [`CLAUDE.md`](CLAUDE.md) |

## Equipo

| Rol | |
|---|---|
| Desarrollador | Juan |
| Product Owner / Curaduría | Flor |
