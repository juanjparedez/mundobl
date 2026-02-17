# MundoBL

Catálogo personal de series asiáticas (BL/GL y otros géneros). Gestión, calificación y seguimiento de series, películas y cortos.

**URL:** [mundobl.win](https://mundobl.win)

## Stack

- **Next.js 16** (App Router)
- **React 19** + **TypeScript 5.9**
- **Ant Design 6**
- **Prisma 7.4** + **PostgreSQL** (Supabase)
- **Vercel** (hosting)

## Desarrollo

```bash
npm install
npm run dev         # http://localhost:3000
npm run build       # Build producción
npm run lint:fix    # Lint + fix
npm run format      # Prettier
```

### Variables de entorno

Copiar `.env.example` y completar:

```
DATABASE_URL=       # Supabase transaction pooler (puerto 6543)
DIRECT_URL=         # Supabase session pooler (puerto 5432)
```

### Migraciones (Prisma)

```bash
npx prisma migrate dev --name descripcion    # Crear migración
npx prisma generate                          # Regenerar cliente
npx prisma studio                            # UI para explorar datos
```

## Estructura

```
src/
├── app/              # Páginas y API routes (Next.js App Router)
│   ├── catalogo/     # Catálogo público con filtros y búsqueda
│   ├── admin/        # Panel admin (CRUD de todas las entidades)
│   ├── actores/      # Perfiles de actores
│   ├── directores/   # Perfiles de directores
│   ├── watching/     # Dashboard "Viendo ahora"
│   └── api/          # REST API (series, seasons, episodes, actors, etc.)
├── components/       # Componentes React (layout, common, series, admin)
├── lib/              # database.ts (Prisma helpers), theme.config.ts, utils
├── hooks/            # useMediaQuery, useMessage
├── types/            # TypeScript types
├── constants/        # Navegación, constantes de series
└── styles/           # CSS variables, globals, dark mode
```

## Documentación

Ver [context.md](context.md) para documentación técnica completa (arquitectura, guía de cambios, schema de DB, etc.).

## Licencia

Proyecto privado
