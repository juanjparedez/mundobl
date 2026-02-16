# Guía de Desarrollo - MundoBL

Este documento contiene instrucciones para Claude Code al trabajar en este proyecto.

## Convenciones del Proyecto

### Estructura de Archivos
- Cada componente React debe tener su propia carpeta con:
  - `ComponentName.tsx` - Lógica del componente
  - `ComponentName.css` - Estilos específicos del componente
- Los archivos deben ser pequeños y enfocados en una sola responsabilidad
- NO usar CSS-in-JS, mantener los estilos en archivos `.css` separados

### Estilos
- Usar variables CSS definidas en `src/styles/variables.css`
- Los temas (claro/oscuro) se manejan mediante el atributo `[data-theme]` en HTML
- Preferir variables CSS sobre valores hardcodeados
- Ejemplos de uso:
  ```css
  background: var(--bg-base);
  color: var(--text-primary);
  padding: var(--spacing-md);
  ```

### TypeScript
- Siempre definir tipos explícitos
- Evitar el uso de `any`, usar tipos específicos o `unknown`
- Los tipos compartidos van en `src/types/`
- Las constantes van en `src/constants/`

### Componentes
- Usar componentes funcionales con hooks
- Exportar componentes con nombres (no default export)
- Props deben tener una interfaz TypeScript clara
- Componentes de presentación en `src/components/common/`
- Componentes de página específicos en carpetas correspondientes

### Principios SOLID
- **Single Responsibility**: Cada componente hace una cosa
- **Open/Closed**: Componentes extensibles mediante props
- **Liskov Substitution**: Componentes intercambiables mediante interfaces
- **Interface Segregation**: Props específicas, no interfaces genéricas grandes
- **Dependency Inversion**: Usar inyección de dependencias via props

### Ant Design
- Importar componentes individualmente: `import { Button, Input } from 'antd'`
- Usar el sistema de Grid (Row, Col) para layouts responsivos
- Aprovechar el sistema de temas de Ant Design en `src/lib/theme.config.ts`
- Usar componentes de Ant Design antes de crear componentes personalizados

### Nomenclatura
- Componentes: PascalCase (ej: `SearchBar`, `PageTitle`)
- Archivos: PascalCase para componentes, camelCase para utilidades
- Variables CSS: kebab-case (ej: `--primary-color`, `--spacing-md`)
- Funciones: camelCase (ej: `handleSearch`, `formatearFecha`)

### Sistema de Datos
- **✅ Base de datos implementada**: SQLite con Prisma ORM
- **✅ Datos importados**: 767 series, 1,475 actores, 11 países
- Usar funciones helper de `src/lib/database.ts` para acceder a datos
- Schema completo en `prisma/schema.prisma`
- Ver `DATABASE.md` para documentación completa

### Acceso a Datos
```typescript
import { getAllSeries, getSeriesById, searchSeriesByTitle } from '@/lib/database';
```

### Futuras Integraciones
- Sistema de autenticación (cuando sea necesario)
- API endpoints para CRUD de series
- Sistema de carga de imágenes
- Backup automático de la base de datos

## Comandos Útiles

```bash
npm run dev         # Desarrollo
npm run build       # Build de producción
npm run lint        # Verificar código
npm run lint:fix    # Corregir problemas de linting
npm run format      # Formatear código con Prettier
```

## Próximos Pasos

1. **✅ Base de Datos** (COMPLETADO)
   - ✅ Schema diseñado e implementado
   - ✅ Datos importados desde Excel (767 series, 1,475 actores)
   - ✅ Funciones helper creadas

2. **Componentes de Visualización** (SIGUIENTE)
   - Crear componente de lista de series con filtros
   - Componente de tarjeta de serie
   - Vista detalle de serie completa
   - Página de actor con sus series
   - Dashboard con estadísticas

3. **Búsqueda y Filtros**
   - Búsqueda por título (helper ya disponible)
   - Filtros por país, tipo, año
   - Filtro por actor/director
   - Ordenamiento configurable
   - Vista de series vistas/no vistas

4. **Funcionalidades CRUD**
   - Formularios de creación/edición de series
   - Confirmaciones de eliminación
   - Validación de formularios
   - Gestión de universos (agrupar series relacionadas)

5. **Sistema de Ratings y Comentarios**
   - Interfaz para agregar ratings por categoría (trama, casting, BSO, etc.)
   - Sistema de comentarios
   - Marcar series como vistas/no vistas

6. **Mejoras UI/UX**
   - Carga de imágenes para series y actores
   - Paginación de listas
   - Loading states
   - Modo offline (PWA)
