# Roadmap - MundoBL

## Prioridad Alta 🔥

### 1. Catálogo con Filtros Avanzados
**Ubicación:** `/catalogo` (ya existe la ruta)

**Filtros necesarios:**
- 🔍 Búsqueda por título
- 🌍 País/Origen
- 📅 Año (rango: desde - hasta)
- 🎬 Tipo (Serie, Película, Corto, Especial)
- 👥 Actor (autocompletado)
- 🎭 Director (autocompletado)
- 🏷️ Tags/Etiquetas (múltiple selección)
- ⭐ Rating mínimo (slider)
- 👁️ Estado: Vista / No vista / Todas
- 📚 Basado en novela (sí/no)

**UI:**
- Sidebar con filtros (colapsable en móvil)
- Grid de cards responsive (4 cols desktop, 2 tablet, 1 móvil)
- **Paginación**: 50 items por página
- Sorting: Título, Año, Rating, Fecha agregada
- Vista: Grid / Lista

**Performance:**
- Lazy loading de imágenes
- Virtual scrolling si es necesario
- Debounce en búsqueda (300ms)

---

### 2. Página de Actor Individual
**Ruta:** `/actores/[id]`

**Secciones:**
- 🎭 **Header**: Foto, nombre, nombre artístico, nacionalidad
- 📊 **Estadísticas**:
  - Total de series/películas
  - Rating promedio de sus obras
  - Géneros/tipos más frecuentes
- 🎬 **Filmografía**:
  - Lista de todas sus series/películas
  - Filtrable por tipo, año
  - Muestra personaje interpretado
  - Click para ir a la serie
- 📝 **Biografía** (si existe)
- 💬 **Notas personales**

**Features:**
- Botón "Agregar a favoritos"
- Exportar filmografía

---

### 3. Gestión de Universos
**Ruta:** `/universos/[id]`

**Casos de uso:**
- **Ejemplo 1**: "La Casa Embrujada"
  - La Casa Embrujada: La Maldición (2015)
  - La Casa Embrujada 2 (2017)
  - La Casa Embrujada: Orígenes (2020)

- **Ejemplo 2**: "Given"
  - Given (Serie, 2019)
  - Given: La Película (2020)
  - Given: Uragawa no Sonzai (2024)

**UI del Universo:**
- 🎬 **Header**: Nombre, descripción, imagen
- 📚 **Timeline**: Orden cronológico vs orden de lanzamiento
- 🎭 **Contenido**: Grid de todas las series/películas del universo
- 📊 **Estadísticas globales**:
  - Total de episodios/películas
  - Años activo
  - Rating promedio del universo
  - Países de producción
- 🔗 **Actores recurrentes**: Quiénes aparecen en múltiples entregas

**CRUD de Universos:**
- Crear nuevo universo
- Asignar series existentes a universo
- Reordenar contenido del universo
- Eliminar universo (sin borrar las series)

---

### 4. Dashboard con Estadísticas
**Ruta:** `/` (home)

**Widgets:**
- 📊 **Resumen General**:
  - Total series/películas/cortos
  - Total vistas vs pendientes
  - Horas totales vistas (estimado)

- ⭐ **Top Rated**:
  - Mejores 10 series por rating
  - Peores 10 (para recordar qué evitar)

- 📅 **Actividad Reciente**:
  - Últimas series agregadas
  - Últimas series vistas
  - Últimos comentarios

- 🌍 **Por País**:
  - Gráfico de distribución
  - Top países por cantidad
  - Top países por rating promedio

- 👥 **Actores Frecuentes**:
  - Actores con más apariciones
  - Tus actores "favoritos" (más vistos)

- 🎯 **Pendientes de Ver**:
  - Lista rápida de series marcadas como "no vistas"
  - Ordenadas por rating (ver las mejores primero)

- 📈 **Tendencias**:
  - Series por año
  - Gráfico de actividad de visualización

---

## Prioridad Media

### 5. Búsqueda Avanzada Global
**Ubicación:** Navbar (siempre visible)

**Features:**
- Buscar en: Series, Actores, Directores, Tags
- Resultados agrupados por tipo
- Accesos rápidos (Ctrl+K / Cmd+K)
- Historial de búsqueda
- Sugerencias mientras escribes

---

### 6. Importación/Exportación
- Exportar catálogo a Excel
- Exportar a JSON (backup)
- Importar desde Excel (actualizado)
- Sincronización con archivo Excel original

---

### 7. Recomendaciones
- "Si te gustó X, te podría gustar Y"
- Basado en:
  - Mismo país
  - Mismos actores
  - Mismo universo
  - Tags similares
  - Rating similar

---

## Prioridad Baja

### 8. Listas Personalizadas
- Crear listas custom ("Para ver este mes", "Favoritas de todos los tiempos", etc.)
- Compartir listas

### 9. Modo Offline
- PWA
- Caché de imágenes
- Funcionalidad sin conexión

### 10. Temas/Personalización
- Temas de color custom
- Configurar qué campos mostrar
- Personalizar categorías de rating

---

## Orden de Implementación Sugerido

1. ✅ **DONE**: Schema BD + Componentes Serie
2. 🔥 **NEXT**: Catálogo con filtros + Paginación (URGENTE para performance)
3. 🎭 Página de Actor
4. 🌌 Gestión de Universos
5. 📊 Dashboard
6. 🔍 Búsqueda Global
7. 📦 Import/Export
8. 💡 Recomendaciones
9. 📋 Listas personalizadas
10. 🌐 PWA/Offline

---

¿Por dónde empezamos? Recomiendo el **Catálogo con filtros** porque:
- Mejora inmediatamente la performance
- Es la funcionalidad más usada
- Base para todo lo demás
