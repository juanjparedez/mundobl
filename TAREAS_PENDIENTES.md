# Tareas Pendientes - MundoBL

## ✅ Completadas (1-7)

1. **FloatButton z-index fix** - Corregido para que no se superponga con sidebar
2. **basedOn + format fields** - Campo dropdown para fuente (libro, novela, manga, etc.) + formato (vertical/regular)
3. **Sistema de Tags** - Tags dinámicos (Enemy to Lovers, etc.) con página de administración
4. **Gestión de Universos** - Agrupación de series relacionadas con CRUD completo
5. **Datos por Temporada** - Actores, ratings, comentarios y sinopsis por temporada
6. **Sinopsis multinivel** - Sinopsis a nivel serie, temporada y episodio
7. **"La vi" multinivel** - Sistema de seguimiento visto/no visto a tres niveles:
   - Serie: Switch + barra de progreso total
   - Temporada: Tag con conteo X/Y vistos
   - Episodio: Checkbox individual con tachado

---

## 📋 Pendientes (8-10)

### 8. "Estoy viendo ahora" - Dashboard de series en progreso
**Objetivo**: Acceso rápido a series que estás viendo actualmente

**Funcionalidades**:
- Campo `currentlyWatching` en ViewStatus o Series
- Widget/sección destacada mostrando series en progreso
- Indicador del último episodio visto
- Quick access desde sidebar o página principal
- Badge mostrando "▶️ Viendo ahora" en las tarjetas
- Ordenar por "última vez vista" o "añadida recientemente"

**Implementación estimada**:
- Schema: Agregar `currentlyWatching: Boolean` y `lastWatchedAt: DateTime`
- API: Endpoint para toggle currently watching
- UI: Componente de dashboard con grid de series actuales
- Sidebar: Link a "/watching" o widget en home

---

### 9. Múltiples series simultáneas - Track varias a la vez
**Objetivo**: Poder marcar varias series como "viendo ahora" simultáneamente

**Funcionalidades**:
- Múltiples series pueden estar marcadas como "currently watching"
- Lista/carrusel de todas las series en progreso
- Indicador de progreso por cada una
- "Continuar viendo" que te lleva al siguiente episodio no visto
- Estadísticas: cuántas series estás viendo, promedio de progreso

**Nota**: Esta tarea complementa la #8, agregando soporte para múltiples series en lugar de solo una.

---

### 10. Configurador de tema en caliente - Theme customizer
**Objetivo**: Personalizar colores del tema sin editar CSS manualmente

**Funcionalidades**:
- Panel/modal de configuración de tema
- Selectores de color para variables CSS principales:
  - `--primary-color`
  - `--bg-base`, `--bg-elevated`
  - `--text-primary`, `--text-secondary`
  - Colores de accent (success, warning, error)
- Preview en tiempo real
- Guardar configuración (localStorage o DB)
- Presets de temas predefinidos (Dark Blue, Purple, Green, etc.)
- Reset a tema por defecto

**Implementación estimada**:
- Componente ThemeConfigurator con color pickers
- Hook useTheme para manejar variables CSS
- Persistencia en localStorage
- Botón en settings o sidebar para abrir configurador

---

## 🐛 Issues Conocidos

- **Error de tema en menú**: Algunos elementos del menú no respetan las variables de tema correctamente
  - Revisar Sidebar.css y variables CSS
  - Verificar que todos los componentes usen `var(--nombre-variable)`

---

## 📊 Progreso General

- **Completadas**: 7/10 (70%)
- **Pendientes**: 3/10 (30%)
- **Tiempo estimado restante**: 2-3 sesiones de trabajo

---

## 🎯 Siguiente Paso Recomendado

**Task 8: "Estoy viendo ahora"** - Es la más útil para la experiencia diaria de usuario y complementa perfecto el sistema de seguimiento que acabamos de implementar.
