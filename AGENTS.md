# MundoBL - Instrucciones para IA

**Contexto completo del proyecto:** Lee `context.md` antes de hacer cualquier cambio.

## Reglas Obligatorias

- Seguir principios SOLID y DRY
- TypeScript estricto: no usar `any`
- Estilos en archivos `.css` separados (NO CSS-in-JS)
- Usar variables CSS de `src/styles/variables.css` y skins de `src/styles/skins/`. Cero hex hardcodeados — todo via tokens, asi tone/skin/accent siguen funcionando dinamicamente
- Componentes funcionales con named exports (no default)
- Cada componente: carpeta propia con `Componente.tsx` + `Componente.css`
- Usar Ant Design antes de crear componentes custom
- Para cards/stats/empty/etc. preferir `src/components/design-system/` (PanelCard, StatCard, ActionCard, MediaCard, Chip, EmptyState, SectionHeader) antes de inventar
- Datos via helpers de `src/lib/database.ts` (Prisma ORM)
- Schema en `prisma/schema.prisma` → migrar con `npx prisma migrate dev`
- i18n: 10 locales (es/en/it/de/fr/ja/ko/zh-CN/zh-TW/th). Toda key user-facing nueva debe agregarse al shape de `src/i18n/messages.ts` y a los 10 locales en el mismo PR. Componentes reciben texto via props/children traducidos (cero hardcodes en componentes)

## Comandos

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run lint:fix     # Lint + fix
npm run format       # Prettier
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
