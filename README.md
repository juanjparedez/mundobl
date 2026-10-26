# MundoBL — mundobl.com.ar

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org)
[![i18n](https://img.shields.io/badge/i18n-10%20idiomas-informational)](docs/ai-context/context.md)

**Plataforma de catalogación, curaduría y streaming oficial de contenido audiovisual asiático (BL/GL).**  
_Curated catalog, tracking, and official streaming hub for Asian BL/GL series and films._

🌐 **Live:** [mundobl.com.ar](https://mundobl.com.ar)

</div>

---

## 🇪🇸 Español

### Qué es

MundoBL es una plataforma full-stack para descubrir, calificar y organizar producciones asiáticas (series, películas, cortos y especiales). Integra curaduría editorial colaborativa, streaming legal embebido de canales oficiales con detección de geobloqueo, glosario cultural y comunidad con logros en tiempo real.

### Qué podés hacer

- **Catálogo curado** con filtros, búsqueda, fichas detalladas, evaluación multicriterio y clasificación editorial (+18 con consentimiento explícito).
- **Streaming oficial (`/ver`)** desde más de 30 canales verificados de productoras y plataformas, con detección de geobloqueo y retomando el video donde lo dejaste.
- **Seguimiento personal (`/watching`)** por capítulo, historial por serie, notas privadas, respaldo exportable, hitos de avance y avisos para terminar o pausar series.
- **Recomendaciones** en cada ficha («Si te gustó esta») y personalizadas en Mi seguimiento, sin algoritmos de pago ni posiciones compradas.
- **Comunidad**: reseñas, conversaciones por capítulo, listas, logros y un ranking mensual anónimo.
- **Estadísticas públicas y pulso de streaming (`/estadisticas`)** con actividad reciente agregada y anónima, reproducciones iniciadas, vistas completas (≥80%), tasa de retención y derivaciones a productoras oficiales.
- **Privacidad y Alias Seudónimos (`/privacidad`)**: arquitectura en dos niveles con telemetría operativa de primera parte (cero IPs, cero cookies de rastreo) y participación comunitaria opt-in con seudónimos poéticos generados en el navegador o cuenta.

### Arquitectura y decisiones técnicas

- **Stack:** Next.js 16 (App Router), React 19, TypeScript estricto (0 `any`), Prisma 7, PostgreSQL (Supabase / local Docker).
- **Modelo de datos robusto:** 83 modelos relacionales, 61 migraciones versionadas y control de concurrencia optimista (`editVersion`) con auditoría de revisiones (`SeriesRevision`).
- **Privacidad por diseño (Privacy by Design):** Telemetría interna agregada en `SiteTrafficDaily` y `SeriesActivityDaily` con claves primarias compuestas por día UTC, sección y país del edge, sin identificadores personales ni almacenamiento de IPs.
- **Eficiencia e ISR en Vercel:** Revalidación bajo demanda (ISR) en fichas públicas, compuerta estricta para contenido adulto (`/adultos`), reducción de payload de catálogo (1 MB → 180 KB en transporte) y extracción de sinopsis bajo demanda para cuidar cuotas de CPU/ISR.
- **Internacionalización profunda:** 10 idiomas completos (`es`, `en`, `it`, `de`, `fr`, `ja`, `ko`, `zh-CN`, `zh-TW`, `th`) con auditoría estricta de paridad de claves.
- **Resiliencia operativa:** Workflows de GitHub Actions para backups periódicos en R2 con prueba de restauración automatizada en base descartable (`backup-restore-test.yml`), migraciones auditadas y despliegue manual controlado.

### Capturas

|                  Catálogo y filtros                  |        Ficha y evaluación multicriterio        |
| :--------------------------------------------------: | :--------------------------------------------: |
|      ![Catálogo](docs/screenshots/catalogo.png)      |   ![Ficha](docs/screenshots/ficha-serie.png)   |
|              **Streaming Hub (`/ver`)**              |         **Curaduría y administración**         |
| ![Streaming Hub](docs/screenshots/streaming-hub.png) | ![Admin](docs/screenshots/admin-curaduria.png) |

### Equipo y escala (octubre 2026)

- **Desarrollo e ingeniería:** Juan Paredez
- **Product Owner & Curaduría:** Flor
- **Métricas:** ~763 títulos catalogados, ~174 usuarios registrados.

---

## 🇬🇧 English

### Overview

MundoBL is a production full-stack platform to discover, track, rate, and stream Asian audiovisual productions (BL/GL series, movies, and specials). It combines collaborative editorial curation, legal embedded streaming with geo-restriction detection, cultural glossaries, and community features.

### Features

- **Curated catalog** with filters, search, rich detail pages, multi-criteria ratings, and editorial classification (18+ behind explicit consent).
- **Official streaming (`/ver`)** from 30+ verified studio and platform channels, with geo-block detection and resume-where-you-left-off.
- **Personal tracking (`/watching`)** per episode, per-series history, private notes, exportable backups, progress milestones, and nudges to finish or pause series.
- **Recommendations** on every series page and personalized in your library, with no paid placement or opaque ranking.
- **Community**: reviews, per-episode discussions, lists, achievements, and an anonymous monthly ranking.
- **Public statistics & streaming pulse (`/estadisticas`)** with aggregated, anonymous recent activity, play starts, 80% completion retention, and official producer referrals.
- **Privacy & Pseudonymous Aliases (`/privacidad`)**: two-tiered privacy architecture combining first-party operational metrics (zero IPs, zero tracking cookies) and voluntary opt-in community participation with poetic pseudonyms.

### Architecture & Technical Decisions

- **Stack:** Next.js 16 (App Router), React 19, strict TypeScript (0 `any`), Prisma 7, PostgreSQL.
- **Relational Domain:** 83 Prisma models, 61 versioned migrations, optimistic locking (`editVersion`), and full snapshot auditing (`SeriesRevision`) on edits.
- **Privacy by Design:** First-party aggregation via `SiteTrafficDaily` and `SeriesActivityDaily` using compound primary keys by UTC day and edge country, completely decoupling operational metrics from personal user data and IP logging.
- **ISR & Edge Cost Optimization:** On-demand Incremental Static Regeneration, dynamic gating for 18+ content, catalog payload compression (1 MB → 180 KB), and on-demand synopsis caching to stay strictly within serverless execution limits.
- **Deep i18n:** Full support for 10 locales with automated key parity enforcement.
- **Reliability Engineering:** Automated backups with end-to-end restore verification in isolated CI databases, audited migration workflows, and manual deployment gates.

---

## Quick Start (Desarrollo local)

```bash
# Instalar dependencias
npm install

# Levantar PostgreSQL local (Docker) + aplicar migraciones + dev server
npm run local:dev

# O con base de datos ya levantada:
npm run dev

# Verificaciones de calidad
npm run check          # type-check + lint
npm run build          # compilación de producción
```

## Documentación del proyecto

- [Manual de mantenimiento y operaciones](docs/manual-mantenimiento.md)
- [Historial de cambios](CHANGELOG.md) (se publica en `/novedades`)
- [Case study de arquitectura](CASE_STUDY.md)
- [Contexto de ingeniería para agentes de IA](docs/ai-context/context.md)
- [Instrucciones de agente](CLAUDE.md)
