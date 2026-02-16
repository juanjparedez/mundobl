# 📋 Próximos Pasos - MundoBL

## ✅ Lo que ya funciona (Completado)

### Base de Datos
- ✅ SQLite con Prisma ORM
- ✅ 767 series importadas desde Excel
- ✅ 1,475 actores únicos
- ✅ 11 países
- ✅ Schema completo con relaciones

### Visualización
- ✅ Página de catálogo con todas las series
- ✅ Búsqueda por título, país y tipo
- ✅ Página de detalles completa para cada serie
- ✅ Actores únicos (sin duplicados)
- ✅ Información de temporadas
- ✅ Observaciones del Excel
- ✅ Página de administración con tabla

## 🚧 Pendientes Identificados

### 1. **Funcionalidad de Edición** (PRIORITARIO)
**Problema actual**: Los botones de editar/eliminar en administración no hacen nada.

**Solución propuesta**:
- Crear modal/formulario de edición
- Implementar API routes para UPDATE y DELETE
- Agregar confirmación antes de eliminar
- Validación de formularios

### 2. **Sistema de Comentarios Múltiples**
**Requerimiento**: Poder agregar varios comentarios a una serie/temporada.

**Solución propuesta**:
- Modificar el schema para permitir múltiples comentarios
- Agregar botón "Agregar comentario" en la vista de detalles
- Modal para escribir nuevo comentario
- Lista de comentarios con fecha

### 3. **Campos Adicionales**
**Nuevos campos requeridos**:
- ✨ **Reseña**: Campo de texto largo para reseña personal
- ✨ **Sinopsis**: Descripción oficial de la serie
- ✨ **Labels/Tags**: Como "Enemy to Lovers", "Slow Burn", etc.

**Solución propuesta**:
```prisma
model Series {
  // Campos existentes...
  synopsis      String?   // Ya existe
  review        String?   // NUEVO - Reseña personal

  // Relaciones
  tags          SeriesTag[] // NUEVO - Tags/labels
}

model Tag {
  id            Int       @id @default(autoincrement())
  name          String    @unique
  category      String?   // "trope", "genre", "mood", etc.
  series        SeriesTag[]
}

model SeriesTag {
  id            Int       @id @default(autoincrement())
  seriesId      Int
  series        Series    @relation(fields: [seriesId], references: [id])
  tagId         Int
  tag           Tag       @relation(fields: [tagId], references: [id])

  @@unique([seriesId, tagId])
}
```

### 4. **Sistema de Carga de Imágenes**
**Requerimiento**: Poder subir imágenes para series y actores.

**Solución propuesta**:
- Usar almacenamiento local en `/public/uploads/`
- O usar servicio externo (Cloudinary, AWS S3)
- Campo `imageUrl` ya existe en el schema
- Agregar componente de upload en el formulario de edición

### 5. **Mejoras de UI/UX**

#### 5.1 Vista de Detalles
- ✅ Actores sin duplicados (HECHO)
- ⏳ Galería de imágenes (cuando se implemente upload)
- ⏳ Botón "Editar" en la vista de detalles
- ⏳ Marcar como "Visto" / "Pendiente"

#### 5.2 Ratings por Categoría
- ⏳ Interfaz para agregar ratings: trama, casting, originalidad, BSO
- ⏳ Visualización con estrellas/barras
- ⏳ Rating promedio calculado

#### 5.3 Filtros Avanzados
- ⏳ Filtrar por actores
- ⏳ Filtrar por tags/labels
- ⏳ Filtrar por año
- ⏳ Filtrar por visto/no visto

## 🎯 Plan de Implementación Sugerido

### Fase 1: CRUD Completo (1-2 días)
1. API routes para editar/eliminar series
2. Modal de edición con formulario completo
3. Validación de datos
4. Confirmación de eliminación

### Fase 2: Campos Nuevos (1 día)
1. Migración del schema (agregar tags, review)
2. Actualizar formularios
3. Mostrar nuevos campos en vista de detalles

### Fase 3: Sistema de Imágenes (1-2 días)
1. Componente de upload
2. Almacenamiento de imágenes
3. Procesamiento (resize, optimización)
4. Mostrar imágenes en tarjetas y detalles

### Fase 4: Comentarios Múltiples (1 día)
1. UI para agregar comentarios
2. Lista de comentarios con fecha/hora
3. Opción de editar/eliminar propios comentarios

### Fase 5: Sistema de Ratings (1 día)
1. Interfaz para agregar ratings por categoría
2. Visualización bonita (estrellas, gráficos)
3. Cálculo de rating promedio

### Fase 6: Tags/Labels (1-2 días)
1. CRUD de tags
2. Asignar tags a series
3. Filtrar por tags
4. Autocomplete para tags existentes

## 📝 Notas Técnicas

### Prioridades
1. **ALTA**: Funcionalidad de edición (bloqueante)
2. **ALTA**: Campos nuevos (review, tags)
3. **MEDIA**: Sistema de imágenes
4. **MEDIA**: Comentarios múltiples
5. **BAJA**: Mejoras visuales

### Consideraciones
- Mantener compatibilidad con datos existentes
- Crear migraciones de Prisma para cambios de schema
- Agregar validación tanto en frontend como backend
- Considerar permisos (¿quién puede editar/eliminar?)

## 🚀 ¿Por dónde empezar?

**Recomendación**: Empezar por **Fase 1 (CRUD Completo)** porque es fundamental y bloqueante para las demás funcionalidades. Una vez que puedas editar series, podrás agregar los campos nuevos y probar todo más fácilmente.

**Siguiente paso inmediato**:
1. Crear API route para actualizar series: `/app/api/series/[id]/route.ts`
2. Crear modal de edición con formulario
3. Conectar el botón "Editar" de la tabla de administración

---

**Fecha de última actualización**: 15 de Febrero de 2026
**Estado actual**: Base de datos funcionando, visualización completa, falta CRUD y campos nuevos
