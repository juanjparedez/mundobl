# 🗄️ Base de Datos - MundoBL

Este documento describe la estructura de la base de datos y cómo trabajar con ella.

## 📊 Resumen de la Implementación

✅ **Base de datos creada**: SQLite con Prisma ORM
✅ **Datos importados**: 767 series, 1475 actores, 11 países
✅ **Schema completo**: 13 modelos relacionados

## 📁 Estructura de la Base de Datos

### Modelos Principales

#### 1. **Universe** (Universos)
Agrupa series relacionadas (ej: "La casa embrujada" con todas sus partes)
- `id`, `name`, `description`, `imageUrl`
- Relación: uno a muchos con `Series`

#### 2. **Series** (Series/Películas/Cortos)
Contenido principal del sistema
- Campos: `title`, `year`, `type`, `isNovel`, `overallRating`, `observations`
- Relaciones:
  - Pertenece a un `Universe` (opcional)
  - Pertenece a un `Country`
  - Tiene muchas `Season`
  - Tiene muchos `Actor` (a través de `SeriesActor`)
  - Tiene muchos `Director` (a través de `SeriesDirector`)
  - Tiene muchos `Rating`, `Comment`, `ViewStatus`

#### 3. **Season** (Temporadas)
Temporadas de cada serie
- Campos: `seasonNumber`, `episodeCount`, `year`, `observations`
- Relaciones:
  - Pertenece a una `Series`
  - Tiene muchos `Episode`
  - Tiene muchos `Actor` (a través de `SeasonActor`)

#### 4. **Actor** (Actores)
Actores que participan en las series
- Campos: `name`, `stageName`, `birthDate`, `nationality`
- Relaciones: muchos a muchos con `Series` y `Season`

#### 5. **Country** (Países)
Países de origen de las series
- Campos: `name`, `code`, `flagUrl`
- Relación: uno a muchos con `Series`

### Modelos Secundarios

- **Episode**: Episodios individuales de cada temporada
- **Director**: Directores de las series
- **Rating**: Ratings por categoría (trama, casting, originalidad, BSO)
- **Comment**: Comentarios sobre series o temporadas
- **ViewStatus**: Estado de visualización (visto/no visto)

### Tablas de Relación

- **SeriesActor**: Actores en series (con personaje)
- **SeasonActor**: Actores en temporadas específicas
- **SeriesDirector**: Directores de series

## 🚀 Uso de la Base de Datos

### Importar el Cliente Prisma

```typescript
import { prisma } from '@/lib/database';
```

### Funciones Helper Disponibles

#### Series
```typescript
// Obtener todas las series
const series = await getAllSeries();

// Buscar por título
const results = await searchSeriesByTitle('2gether');

// Filtrar por país
const koreanSeries = await getSeriesByCountry(countryId);

// Filtrar por tipo
const movies = await getSeriesByType('pelicula');

// Obtener por ID con toda la info
const serie = await getSeriesById(1);
```

#### Actores
```typescript
// Obtener todos los actores
const actors = await getAllActors();

// Buscar por nombre
const results = await searchActorsByName('Bright');

// Obtener actor con sus series
const actor = await getActorById(1);
```

#### Países
```typescript
// Obtener todos los países con conteo de series
const countries = await getAllCountries();

// Obtener país con sus series
const country = await getCountryById(1);
```

#### Estadísticas
```typescript
// Estadísticas generales
const stats = await getStats();
// { totalSeries, totalSeasons, totalActors, totalCountries, totalEpisodes }

// Estadísticas de visualización
const viewStats = await getViewStats();
// { watched, unwatched, total }
```

#### Universos
```typescript
// Obtener todos los universos
const universes = await getAllUniverses();

// Obtener universo con sus series
const universe = await getUniverseById(1);
```

## 📝 Scripts Disponibles

### Importación desde Excel
```bash
npx tsx scripts/import-excel.ts
```
Importa datos desde `data/Series Asiáticas.xlsx` a la base de datos.

### Prueba de Conexión
```bash
npx tsx scripts/test-db.ts
```
Verifica que la conexión a la base de datos funcione correctamente.

### Prueba de Helpers
```bash
npx tsx scripts/test-database-helpers.ts
```
Prueba todas las funciones helper y muestra estadísticas.

## 🔧 Comandos de Prisma

### Generar Cliente
```bash
npx prisma generate
```

### Crear Migración
```bash
npx prisma migrate dev --name nombre_de_migracion
```

### Prisma Studio (GUI para ver/editar datos)
```bash
npx prisma studio
```

### Reset de Base de Datos
```bash
npx prisma migrate reset
```
⚠️ **ADVERTENCIA**: Esto eliminará TODOS los datos!

## 📍 Ubicación de Archivos

- **Base de datos**: `/data/mundobl.db`
- **Schema**: `/prisma/schema.prisma`
- **Migraciones**: `/prisma/migrations/`
- **Cliente generado**: `/src/generated/prisma/`
- **Helpers**: `/src/lib/database.ts`
- **Scripts**: `/scripts/`

## 🎯 Próximos Pasos Sugeridos

1. **Crear componentes React para visualizar los datos**
   - Lista de series con filtros
   - Vista detalle de serie
   - Página de actor
   - Estadísticas

2. **Implementar búsqueda avanzada**
   - Por actores
   - Por director
   - Por rango de años
   - Por rating

3. **Sistema de ratings**
   - Interfaz para agregar ratings por categoría
   - Gráficos de comparación

4. **Gestión de universos**
   - Crear/editar universos
   - Agrupar series relacionadas

5. **Import/Export**
   - Exportar datos a Excel
   - Backup automático de la base de datos

## 🐛 Troubleshooting

### Error: "Unable to open database file"
- Verificar que la ruta en `.env` sea correcta
- Verificar permisos del archivo de base de datos

### Error: "URL_INVALID"
- Asegurarse de estar usando Prisma 5 (no 7)
- Verificar que `.env` tenga `DATABASE_URL` configurado

### Regenerar base de datos desde cero
```bash
rm data/mundobl.db
npx prisma migrate dev
npx tsx scripts/import-excel.ts
```

## 📊 Estadísticas Actuales

- **Series**: 767
- **Temporadas**: 731
- **Actores**: 1,475
- **Países**: 11
- **Distribución por país**:
  - Tailandia: 274 series (35.7%)
  - Corea: 149 series (19.4%)
  - Japón: 93 series (12.1%)
  - China: 44 series (5.7%)
  - Taiwan: 41 series (5.3%)
  - Filipinas: 26 series (3.4%)
  - Vietnam: 19 series (2.5%)
  - Otros: 121 series (15.8%)
