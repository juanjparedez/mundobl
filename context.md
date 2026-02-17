# MundoBL - Contexto del Proyecto

Catálogo personal de series asiáticas (BL/GL y otros géneros). Aplicación full-stack para gestionar, calificar y hacer seguimiento de series, películas y cortos.

---

## Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| **Next.js** | 16 | Framework (App Router) |
| **React** | 19 | UI |
| **TypeScript** | 5.9 | Tipado estricto |
| **Ant Design** | 6 | Componentes UI |
| **Prisma** | 7.4 | ORM |
| **PostgreSQL** | - | Base de datos (Supabase) |

## Infraestructura

| Servicio | Detalle |
|---|---|
| **Hosting** | Vercel (deploy automático desde GitHub) |
| **Base de datos** | Supabase PostgreSQL (sa-east-1, São Paulo) |
| **Dominio** | mundobl.win (DNS en Cloudflare, CNAME a Vercel) |
| **SSL** | Automático via Vercel |

### Variables de Entorno (Vercel + .env local)

```
DATABASE_URL       # Transaction pooler (puerto 6543) - para la app
DIRECT_URL         # Session pooler (puerto 5432) - para migraciones Prisma
```

---

## Principios de Desarrollo

### SOLID
- **Single Responsibility**: Cada componente/archivo hace una sola cosa
- **Open/Closed**: Componentes extensibles via props
- **Liskov Substitution**: Componentes intercambiables via interfaces
- **Interface Segregation**: Props específicas, no interfaces genéricas
- **Dependency Inversion**: Inyección de dependencias via props

### DRY & Buenas Prácticas
- No repetir lógica: extraer a helpers en `src/lib/` o hooks en `src/hooks/`
- Componentes reutilizables en `src/components/common/`
- Tipos compartidos en `src/types/`
- Constantes en `src/constants/`
- No usar `any` en TypeScript, usar tipos específicos o `unknown`

### Estilos
- **NO usar CSS-in-JS**. Estilos en archivos `.css` separados por componente
- Usar variables CSS definidas en `src/styles/variables.css`
- Temas claro/oscuro via atributo `[data-theme]` en HTML
- Preferir variables CSS sobre valores hardcodeados:
  ```css
  background: var(--bg-base);
  color: var(--text-primary);
  padding: var(--spacing-md);
  ```
- Tema de Ant Design configurado en `src/lib/theme.config.ts`

### Componentes
- Funcionales con hooks (no clases)
- Exportar con nombre (no default export)
- Props con interfaz TypeScript explícita
- Cada componente tiene su carpeta: `Component.tsx` + `Component.css`
- Usar componentes de Ant Design antes de crear personalizados
- Importar Ant Design individualmente: `import { Button, Input } from 'antd'`

### Nomenclatura
- Componentes: **PascalCase** (`SearchBar`, `PageTitle`)
- Archivos componentes: **PascalCase**, utilidades: **camelCase**
- Variables CSS: **kebab-case** (`--primary-color`, `--spacing-md`)
- Funciones: **camelCase** (`handleSearch`, `formatearFecha`)

---

## Estructura del Proyecto

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout raíz (Ant Design + ThemeProvider)
│   ├── page.tsx                  # Home → redirige a /catalogo
│   ├── api/                      # API REST endpoints
│   │   ├── series/               # CRUD series + ratings, comments, favorites, view-status
│   │   ├── seasons/              # CRUD temporadas + ratings, comments
│   │   ├── episodes/             # CRUD episodios + view-status, comments, generate
│   │   ├── actors/               # CRUD actores + merge duplicados
│   │   ├── directors/            # CRUD directores + merge duplicados
│   │   ├── tags/                 # CRUD tags + merge duplicados
│   │   ├── universes/            # CRUD universos
│   │   ├── languages/            # CRUD idiomas
│   │   ├── production-companies/ # CRUD productoras
│   │   ├── countries/            # Lectura países
│   │   ├── currently-watching/   # Series en curso
│   │   └── upload/               # Subida de imágenes
│   ├── catalogo/                 # Catálogo público
│   │   ├── page.tsx              # Server component: fetch series
│   │   ├── CatalogoClient.tsx    # Client component: filtros, búsqueda, paginación
│   │   └── [id]/                 # Detalle de serie
│   ├── admin/                    # Panel de administración
│   │   ├── page.tsx              # Tabla de series
│   │   ├── series/nueva/         # Crear serie
│   │   ├── series/[id]/editar/   # Editar serie
│   │   ├── actores/              # Gestión actores
│   │   ├── directores/           # Gestión directores
│   │   ├── tags/                 # Gestión tags
│   │   ├── universos/            # Gestión universos
│   │   ├── idiomas/              # Gestión idiomas
│   │   └── productoras/          # Gestión productoras
│   ├── actores/[id]/             # Perfil de actor
│   ├── directores/[id]/          # Perfil de director
│   └── watching/                 # Dashboard "Viendo ahora"
├── components/
│   ├── layout/                   # AppLayout, Header, Sidebar, BottomNav
│   ├── common/                   # PageTitle, SearchBar, CommentsList
│   ├── series/                   # SeriesHeader, SeriesInfo, SeasonsList, EpisodesList,
│   │                             # RatingSection, CommentsSection, ViewStatusToggle
│   ├── admin/                    # SeriesForm, SeasonForm, SeasonEditForm
│   └── watching/                 # CurrentlyWatchingDashboard
├── lib/
│   ├── database.ts               # Helpers de acceso a DB (Prisma)
│   ├── theme.config.ts           # Configuración tema Ant Design
│   ├── utils.ts                  # Utilidades generales
│   └── providers/ThemeProvider.tsx
├── hooks/                        # useMediaQuery, useMessage
├── types/                        # series.types.ts, content.ts, person.types.ts, theme.types.ts
├── constants/                    # navigation.ts, series.ts
├── styles/                       # globals.css, variables.css, dark-mode-fixes.css
└── generated/prisma/             # Cliente Prisma generado (no editar)
```

---

## Patrón de Datos (Server → Client)

```
page.tsx (Server Component)
  → Llama a src/lib/database.ts (Prisma query)
  → Pasa datos como props a *Client.tsx (Client Component)
  → Client Component maneja interactividad y estado
  → Cambios del usuario → API call (fetch a /api/*) → Actualizar UI
```

### Acceso a Base de Datos

```typescript
// En Server Components o API routes:
import { getAllSeries, getSeriesById, searchSeriesByTitle } from '@/lib/database';

// Funciones disponibles:
// Series: getAllSeries, getSeriesById, searchSeriesByTitle, getSeriesByCountry, getSeriesByType
// Actores: getAllActors, getActorById, searchActorsByName, getAllActorsWithCount
// Directores: getAllDirectors, getDirectorById, searchDirectorsByName, getAllDirectorsWithCount
// Países: getAllCountries, getCountryById
// Universos: getAllUniverses, getUniverseById
// Stats: getStats, getViewStats
```

---

## Base de Datos (Prisma + Supabase)

### Schema: `prisma/schema.prisma`

**Modelos principales:**
- `Series` - Series/películas/cortos (767 registros importados)
- `Season` - Temporadas por serie
- `Episode` - Episodios por temporada
- `Actor` - Actores (1,475 registros)
- `Director` - Directores
- `Country` - Países (11 registros)

**Modelos de relación:**
- `SeriesActor`, `SeasonActor` - Actores por serie/temporada
- `SeriesDirector` - Directores por serie
- `SeriesTag` - Tags por serie

**Modelos de metadata:**
- `Universe` - Agrupación de series relacionadas
- `Tag` - Etiquetas (tropes, genres, moods)
- `ProductionCompany`, `Language`, `SeriesDubbing`
- `Rating` - Calificaciones por categoría (trama, casting, BSO, etc.)
- `Comment` - Comentarios en serie/temporada/episodio
- `ViewStatus` - Estado visto/no visto/viendo

### Migraciones

```bash
# Generar cliente Prisma después de cambios al schema
npx prisma generate

# Crear migración después de cambios al schema
npx prisma migrate dev --name descripcion_del_cambio

# Aplicar migraciones en producción (Vercel lo hace automáticamente en build)
npx prisma migrate deploy

# Ver estado de migraciones
npx prisma migrate status

# Abrir Prisma Studio (UI para explorar datos)
npx prisma studio
```

**Nota:** El build command en Vercel es `prisma generate && next build --webpack`. Prisma genera el cliente automáticamente antes de cada build.

### Agregar un campo nuevo (ejemplo)

1. Editar `prisma/schema.prisma` (agregar campo al modelo)
2. `npx prisma migrate dev --name add_campo_nuevo`
3. Actualizar tipos en `src/types/` si aplica
4. Actualizar helpers en `src/lib/database.ts` si aplica
5. Actualizar componentes que muestren el campo

### Agregar un modelo nuevo

1. Definir modelo en `prisma/schema.prisma` con relaciones
2. `npx prisma migrate dev --name add_nombre_modelo`
3. Crear API route en `src/app/api/nombre-modelo/route.ts`
4. Agregar helpers en `src/lib/database.ts`
5. Crear componentes de UI

---

## Guía de Cambios Comunes

### Agregar una nueva página

1. Crear carpeta en `src/app/nombre-pagina/`
2. `page.tsx` (Server Component) - fetch de datos
3. `NombreClient.tsx` (Client Component) - UI interactiva
4. `nombre.css` - Estilos
5. Agregar ruta en `src/constants/navigation.ts`

### Agregar un nuevo componente

1. Crear carpeta en `src/components/categoria/NombreComponente/`
2. `NombreComponente.tsx` - Lógica
3. `NombreComponente.css` - Estilos
4. Exportar con nombre: `export function NombreComponente()`

### Agregar un endpoint API

1. Crear `src/app/api/recurso/route.ts`
2. Exportar funciones HTTP: `GET`, `POST`, `PUT`, `DELETE`
3. Usar helpers de `src/lib/database.ts` o Prisma directo
4. Retornar `NextResponse.json()`

### Modificar filtros del catálogo

- Filtros están en `src/app/catalogo/CatalogoClient.tsx`
- Tipos de filtro en `src/types/series.types.ts`

### Modificar tema/estilos globales

- Variables CSS: `src/styles/variables.css`
- Tema Ant Design: `src/lib/theme.config.ts`
- Dark mode fixes: `src/styles/dark-mode-fixes.css`

---

## Comandos

```bash
npm run dev          # Desarrollo (http://localhost:3000)
npm run build        # Build de producción
npm run start        # Servir build de producción
npm run lint         # Verificar código
npm run lint:fix     # Corregir problemas de linting
npm run format       # Formatear con Prettier
npm run type-check   # Verificar tipos TypeScript
```

---

## Datos del Proyecto

- **767 series** importadas (originalmente desde Excel)
- **1,475 actores** registrados
- **11 países**: Tailandia (35.7%), Corea (19.4%), Japón (12.1%), China, Taiwán, Filipinas, Vietnam, Myanmar, Camboya, Indonesia, Laos
- **Tipos**: serie, película, corto, especial
- **Formatos**: regular, vertical

---

## Estado Actual y Pendientes

### Implementado
- Catálogo con búsqueda, filtros y paginación
- Detalle de serie con temporadas, episodios, ratings, comentarios
- Perfiles de actores y directores
- Panel admin completo (CRUD de todas las entidades)
- Sistema de tags/etiquetas
- Universos (agrupar series relacionadas)
- Estado de visualización (visto/no visto/viendo)
- Dashboard "Viendo ahora"
- Tema claro/oscuro
- Diseño responsive (mobile + desktop)

### Pendiente
- Sistema de carga de imágenes (actualmente URLs manuales)
- Dashboard con estadísticas avanzadas (top-rated, por país, trending)
- Búsqueda avanzada (múltiples criterios combinados)
- Import/export de datos
- Sistema de recomendaciones
- Modo offline (PWA)
