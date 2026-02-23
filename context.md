# MundoBL - Contexto del Proyecto

Catalogo personal de series asiaticas (BL/GL y otros generos). Aplicacion full-stack para gestionar, calificar y hacer seguimiento de series, peliculas, cortos y especiales.

---

## Stack Tecnologico

| Tecnologia | Version | Uso |
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
| **Hosting** | Vercel (deploy automatico desde GitHub) |
| **Base de datos** | Supabase PostgreSQL (sa-east-1, Sao Paulo) |
| **Almacenamiento** | Supabase Storage (bucket `images`) |
| **Auth** | NextAuth.js (Google OAuth) |
| **Dominio** | mundobl.win (DNS en Cloudflare, CNAME a Vercel) |
| **SSL** | Automatico via Vercel |

### Variables de Entorno (Vercel + .env local)

```
DATABASE_URL                # Transaction pooler (puerto 6543) - para la app
DIRECT_URL                  # Session pooler (puerto 5432) - para migraciones Prisma
AUTH_SECRET                 # Secret para NextAuth
AUTH_GOOGLE_ID              # Google OAuth client ID
AUTH_GOOGLE_SECRET          # Google OAuth client secret
NEXT_PUBLIC_SUPABASE_URL    # URL del proyecto Supabase
SUPABASE_SERVICE_ROLE_KEY   # Service role key de Supabase
PROJECT_GITHUB_URL          # Link a GitHub (para /admin/info)
PROJECT_VERCEL_URL          # Link a Vercel (para /admin/info)
PROJECT_SUPABASE_URL        # Link a Supabase (para /admin/info)
```

---

## Principios de Desarrollo

### SOLID
- **Single Responsibility**: Cada componente/archivo hace una sola cosa
- **Open/Closed**: Componentes extensibles via props
- **Liskov Substitution**: Componentes intercambiables via interfaces
- **Interface Segregation**: Props especificas, no interfaces genericas
- **Dependency Inversion**: Inyeccion de dependencias via props

### DRY & Buenas Practicas
- No repetir logica: extraer a helpers en `src/lib/` o hooks en `src/hooks/`
- Componentes reutilizables en `src/components/common/`
- Tipos compartidos en `src/types/`
- Constantes en `src/constants/`
- No usar `any` en TypeScript, usar tipos especificos o `unknown`

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
- Props con interfaz TypeScript explicita
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
│   ├── layout.tsx                # Layout raiz (Ant Design + ThemeProvider)
│   ├── page.tsx                  # Home → redirige a /catalogo
│   ├── api/                      # API REST endpoints
│   │   ├── series/               # CRUD series + ratings, comments, favorites, view-status, search
│   │   ├── seasons/              # CRUD temporadas + ratings, comments
│   │   ├── episodes/             # CRUD episodios + view-status, comments, generate
│   │   ├── actors/               # CRUD actores + merge duplicados
│   │   ├── directors/            # CRUD directores + merge duplicados
│   │   ├── tags/                 # CRUD tags + merge duplicados
│   │   ├── universes/            # CRUD universos
│   │   ├── languages/            # CRUD idiomas
│   │   ├── production-companies/ # CRUD productoras
│   │   ├── countries/            # Lectura paises
│   │   ├── genres/               # CRUD generos
│   │   ├── currently-watching/   # Series en curso (filtrado por usuario)
│   │   ├── contenido/            # CRUD contenido embebible + import de canales
│   │   ├── sitios/               # CRUD sitios recomendados + sugeridos
│   │   ├── feature-requests/     # Feedback + votos
│   │   ├── upload/               # Subida de imagenes (Supabase Storage)
│   │   ├── users/                # Gestion de usuarios
│   │   ├── admin/                # Logs, info del proyecto (solo admin)
│   │   ├── changelog/            # Changelog publico
│   │   └── build-info/           # Info de build/version
│   ├── catalogo/                 # Catalogo publico
│   │   ├── page.tsx              # Server component: fetch series
│   │   ├── CatalogoClient.tsx    # Client component: filtros, busqueda, paginacion
│   │   └── [id]/                 # Detalle de serie
│   ├── contenido/                # Pagina publica de contenido embebible
│   ├── sitios/                   # Pagina publica de sitios recomendados
│   ├── admin/                    # Panel de administracion
│   │   ├── page.tsx              # Tabla de series
│   │   ├── series/nueva/         # Crear serie
│   │   ├── series/[id]/editar/   # Editar serie
│   │   ├── actores/              # Gestion actores
│   │   ├── directores/           # Gestion directores
│   │   ├── tags/                 # Gestion tags
│   │   ├── universos/            # Gestion universos
│   │   ├── idiomas/              # Gestion idiomas
│   │   ├── productoras/          # Gestion productoras
│   │   ├── sitios/               # Gestion sitios recomendados
│   │   ├── contenido/            # Gestion contenido embebible + import canales
│   │   ├── usuarios/             # Gestion usuarios y roles
│   │   ├── logs/                 # Access logs con filtros clickeables
│   │   └── info/                 # Info del proyecto (links, equipo)
│   ├── feedback/                 # Feedback + Changelog
│   ├── actores/[id]/             # Perfil de actor
│   ├── directores/[id]/          # Perfil de director
│   ├── series/[id]/              # Detalle de serie (publica)
│   └── watching/                 # Dashboard "Viendo ahora"
├── components/
│   ├── layout/                   # AppLayout, Header, Sidebar, BottomNav
│   ├── common/                   # PageTitle, SearchBar, CommentsList, EmbedPlayer,
│   │                             # ContentDisclaimer, CountryFlag
│   ├── series/                   # SeriesHeader, SeriesInfo, SeasonsList, EpisodesList,
│   │                             # RatingSection, CommentsSection, ViewStatusToggle
│   ├── admin/                    # SeriesForm, SeasonForm, SeasonEditForm, SeriesContentManager
│   └── watching/                 # CurrentlyWatchingDashboard
├── lib/
│   ├── database.ts               # Helpers de acceso a DB (Prisma)
│   ├── supabase.ts               # Cliente Supabase Storage (upload/delete/downloadAndUpload)
│   ├── auth.ts                   # Configuracion NextAuth
│   ├── auth-helpers.ts           # requireAuth, requireRole
│   ├── access-log.ts             # Registro y consulta de access logs
│   ├── embed-helpers.ts          # Helpers para contenido embebible (YouTube, etc.)
│   ├── channel-fetcher.ts        # Importacion de videos de canales de YouTube
│   ├── country-codes.ts          # Codigos de pais
│   ├── theme.config.ts           # Configuracion tema Ant Design
│   ├── utils.ts                  # Utilidades generales
│   └── providers/ThemeProvider.tsx
├── hooks/                        # useMediaQuery, useMessage
├── types/                        # series.types.ts, content.ts, person.types.ts, theme.types.ts
├── constants/                    # navigation.ts, series.ts, sitios.ts
├── styles/                       # globals.css, variables.css, dark-mode-fixes.css
└── generated/prisma/             # Cliente Prisma generado (no editar)
```

---

## Patron de Datos (Server → Client)

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
// Paises: getAllCountries, getCountryById
// Universos: getAllUniverses, getUniverseById
// Stats: getStats, getViewStats
```

---

## Base de Datos (Prisma + Supabase)

### Schema: `prisma/schema.prisma`

**Modelos principales:**
- `Series` - Series/peliculas/cortos
- `Season` - Temporadas por serie
- `Episode` - Episodios por temporada
- `Actor` - Actores
- `Director` - Directores
- `Country` - Paises

**Modelos de relacion:**
- `SeriesActor`, `SeasonActor` - Actores por serie/temporada (con pairingGroup)
- `SeriesDirector` - Directores por serie
- `SeriesTag` - Tags por serie
- `SeriesGenre` - Generos por serie
- `SeriesDubbing` - Idiomas de doblaje
- `RelatedSeries` - Series relacionadas (bidireccional)

**Modelos de metadata:**
- `Universe` - Agrupacion de series relacionadas
- `Tag` - Etiquetas (tropes, genres, moods)
- `Genre` - Generos
- `ProductionCompany`, `Language`
- `Rating` - Calificaciones por categoria (trama, casting, BSO, etc.)
- `UserRating` - Calificaciones de usuarios
- `Comment` - Comentarios en serie/temporada/episodio (con userId)
- `ViewStatus` - Estado de visualizacion (`WatchStatus` enum, por usuario)

**Modelos de contenido:**
- `EmbeddableContent` - Contenido embebido (trailers, OSTs, entrevistas)
- `RecommendedSite` - Sitios recomendados curados por admin
- `SuggestedSite` - Sitios sugeridos por la comunidad
- `WatchLink` - Plataformas donde ver cada serie

**Modelos de feedback:**
- `FeatureRequest` - Solicitudes de bugs/features/ideas con status y prioridad
- `FeatureRequestImage` - Imagenes adjuntas a solicitudes
- `FeatureVote` - Votos de usuarios en solicitudes

**Modelos de sistema:**
- `User`, `Account`, `Session`, `VerificationToken` - NextAuth
- `AccessLog` - Registro de visitas y acciones
- `BannedIp` - IPs bloqueadas

**Enums:**
- `Role` - USER, MODERATOR, ADMIN
- `WatchStatus` - SIN_VER, VIENDO, VISTA, ABANDONADA, RETOMAR

### Migraciones

```bash
# Generar cliente Prisma despues de cambios al schema
npx prisma generate

# Crear migracion despues de cambios al schema
npx prisma migrate dev --name descripcion_del_cambio

# Aplicar migraciones en produccion (Vercel lo hace automaticamente en build)
npx prisma migrate deploy

# Ver estado de migraciones
npx prisma migrate status

# Sincronizar schema sin migraciones (desarrollo)
npx prisma db push

# Abrir Prisma Studio (UI para explorar datos)
npx prisma studio
```

**Nota:** El build command en Vercel es `prisma generate && next build --webpack`. Prisma genera el cliente automaticamente antes de cada build.

---

## Guia de Cambios Comunes

### Agregar una nueva pagina

1. Crear carpeta en `src/app/nombre-pagina/`
2. `page.tsx` (Server Component) - fetch de datos
3. `NombreClient.tsx` (Client Component) - UI interactiva
4. `nombre.css` - Estilos
5. Agregar ruta en `src/constants/navigation.ts`

### Agregar un nuevo componente

1. Crear carpeta en `src/components/categoria/NombreComponente/`
2. `NombreComponente.tsx` - Logica
3. `NombreComponente.css` - Estilos
4. Exportar con nombre: `export function NombreComponente()`

### Agregar un endpoint API

1. Crear `src/app/api/recurso/route.ts`
2. Exportar funciones HTTP: `GET`, `POST`, `PUT`, `DELETE`
3. Proteger con `requireAuth()` o `requireRole(['ADMIN'])`
4. Usar helpers de `src/lib/database.ts` o Prisma directo
5. Retornar `NextResponse.json()`

### Modificar filtros del catalogo

- Filtros estan en `src/app/catalogo/CatalogoClient.tsx`
- Tipos de filtro en `src/types/series.types.ts`

### Modificar tema/estilos globales

- Variables CSS: `src/styles/variables.css`
- Tema Ant Design: `src/lib/theme.config.ts`
- Dark mode fixes: `src/styles/dark-mode-fixes.css`

---

## Comandos

```bash
npm run dev          # Desarrollo (http://localhost:3000)
npm run build        # Build de produccion
npm run start        # Servir build de produccion
npm run lint         # Verificar codigo
npm run lint:fix     # Corregir problemas de linting
npm run format       # Formatear con Prettier
npm run type-check   # Verificar tipos TypeScript
```
