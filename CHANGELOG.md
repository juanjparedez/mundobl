# Changelog

Todas las versiones notables del proyecto se documentan aqui.

## Proximo deploy

### Features
- Mapeo completo de paises del mundo (~200) con codigos ISO para banderas automaticas
- Script de seed para insertar todos los paises en la DB (`scripts/seed-all-countries.ts`)
- Rediseno de lista de episodios: layout compacto tipo tabla con seleccion masiva
- Endpoint de borrado masivo de episodios (`POST /api/episodes/bulk-delete`)
- Acciones masivas en episodios: marcar como vistos/no vistos, eliminar seleccionados
- Nuevas categorias de rating: Direccion, Guion, Produccion, Quimica de pareja principal/secundaria
- Categorias de rating eliminadas: Ritmo, Actuacion, Originalidad

### Fixes
- Fix: dialogo "Deseas abandonar el sitio" al editar temporadas (beforeunload falso positivo)

### Seguridad
- Filtro de paths de scanners en middleware (bloqueo sin loguear)
- Extraccion de IP real del cliente via `CF-Connecting-IP` (Cloudflare)
- No loguear assets/PWA (icons, manifest, sw.js)
- Endpoint para limpiar logs de scanners (`DELETE /api/admin/logs?type=scanners`)
- Fix: endpoint POST `/api/genres` ahora requiere autenticacion (ADMIN/MODERATOR)
- Fix: endpoint GET `/api/episodes/[id]/view-status` ahora requiere autenticacion y filtra por usuario

### Features
- Banner de bienvenida para visitantes no logueados en el catalogo
- Parejas de protagonistas ahora se ordenan por numero de grupo (pareja 1 primero)
- Banderitas de pais en tarjetas de Universos
- Vista de logs responsive con cards para mobile
- Boton "Limpiar scanners" en la pagina de admin logs

### Anteriores
- Nuevas categorias de sitios: Oficiales, Productoras, YouTube
- Constantes de sitios centralizadas en `src/constants/sitios.ts`
- Modelo `SuggestedSite` para sugerencias de la comunidad
- API de sitios sugeridos (`/api/sitios/sugeridos`)
- Fix: watchLinks no se cargaban al editar una serie (seccion "Donde Ver")
- Fix: "Currently Watching" ahora filtra por usuario autenticado
- Fix: boton "Editar" en watching solo visible para admin/mod
- Logos/imagenes en cards de sitios
- Thumbnails en tabla admin de contenido embebible
- Deteccion y filtro de contenido duplicado en admin
- Filtros clickeables en logs (usuario, accion, ruta, IP)
- Filtro por ruta en logs de admin
- Alineamiento de cards en pagina de contenido
- Limpieza de archivos obsoletos (scripts, sites/, this-session.md)
- Baseline de migraciones Prisma (historial limpio)

## 22ba64c

- Mejora en flujo de sitios visitados

## 41e684d

- Fix carga inicial de contenido

## ee34bfa

- Actualizacion de pagina de feedback

## c05d71a

- Mejora del sistema de versiones

## 575649c

- Fix estilos de modales

## 8b32c37

- Fix redirect del router despues de crear contenido

## f9133fe

- Agregar chequeo de version (StaleVersionNotifier)

## e669a65

- Fix flujo de creacion de contenido

## c0dfc93

- Mejoras en formulario de series

## 9402261

- Agregar contenido embebido a la pagina de series

## d1abf70

- Permitir crear universos al vuelo desde el formulario de series

## d397580

- Agregar importacion de canales

## 137c773

- Mejorar pagina de contenido y sitios recomendados

## 4fc5a11

- Soporte para contenido embebido (YouTube, etc.)

## f9534b1

- Agregar pagina de logs de acceso

## c0c5648

- Agregar paginas internas de administracion

## ff31a03

- Tareas de Flor + Supabase Storage + imagenes en feedback

## 7bf8de0

- Mejorar tarjetas de universo

## 6a0eab4

- Agregar posicionador de imagenes

## 297ba4f

- Login con OAuth

## dfa7505

- Primera version funcional
