# MundoBL - Instrucciones para IA

**Contexto completo del proyecto:** Lee `context.md` antes de hacer cualquier cambio.

## Reglas Obligatorias

- Seguir principios SOLID y DRY
- TypeScript estricto: no usar `any`
- Estilos en archivos `.css` separados (NO CSS-in-JS)
- Usar variables CSS de `src/styles/variables.css`
- Componentes funcionales con named exports (no default)
- Cada componente: carpeta propia con `Componente.tsx` + `Componente.css`
- Usar Ant Design antes de crear componentes custom
- Datos via helpers de `src/lib/database.ts` (Prisma ORM)
- Schema en `prisma/schema.prisma` → migrar con `npx prisma migrate dev`

## Comandos

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run lint:fix     # Lint + fix
npm run format       # Prettier
```
