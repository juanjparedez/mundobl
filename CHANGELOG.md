# Changelog

Todas las versiones notables del proyecto se documentan aqui.

## Proximo deploy

### Features
- Suscripciones a series: boton de campana en pagina de serie permite suscribirse para recibir avisos cuando hay novedades
- Modelo `SeriesSubscription` con dispatch automatico de notificaciones in-app a suscriptores cuando se agregan temporadas, contenido embebido o se publica una resena
- Helper `notifySeriesSubscribers` no-bloqueante e idempotente reutilizable en cualquier endpoint
- Campana de notificaciones renderizada en sidebar (desktop) y BottomNav (mobile) con badge de no leidas
- Hook `useUnreadNotifications` con poll cada 30s, refresh inmediato al volver a la pestaña y pausa cuando esta oculta
- Catalogo: chips adicionales en cada card (plataforma, genero) para mejor identificacion visual
- Mobile: rediseno cinematografico del header de serie — poster full-width con fade-out, contenido emerge debajo
- Pagina /novedades reorganizada: changelog en orden cronologico (mas reciente primero), layout mas compacto

### Performance
- Preconnect a Supabase storage en root layout (ahorra 100-200ms en primera carga de imagenes)
- DNS-prefetch a hosts de YouTube (i.ytimg.com, img.youtube.com)

### Fixes
- Eliminada navegacion a /notificaciones desde acciones rapidas de serie (reemplazada por toggle de suscripcion)

## 2026-04 — Catalogo, news, feedback y PWA (deployado)

### Features
- Panel de administracion de changelog en `/admin/changelog`
- CRUD completo de novedades desde DB (`/api/admin/changelog`)
- Endpoint publico de changelog (`/api/changelog`) ahora prioriza DB y usa fallback a archivo
- Boton para importar changelog historico desde `CHANGELOG.md` al panel admin
- Feedback: nueva pestaña "Mis solicitudes" para seguimiento de casos del usuario
- Feedback: hilo de comentarios por solicitud con carga lazy y publicacion inline
- Feedback: gestion completa de casos del usuario en perfil (editar, replicar, comentar, eliminar, cambiar estado)
- Feedback: nuevos endpoints para CRUD de casos y comentarios
- Sidebar admin: acceso directo a "Novedades" y "Casos"
- Noticias BL: Fase 1 completa con panel admin `/admin/noticias`, generacion de resumen con IA y feed publico `/noticias`
- Noticias BL: modelo `News` + `NewsTag` con estados editoriales (`DRAFT | REVIEW | APPROVED | PUBLISHED | REJECTED`)
- Mapeo completo de paises del mundo (~200) con codigos ISO para banderas automaticas
- Rediseno de lista de episodios: layout compacto tipo tabla con seleccion masiva
- Endpoint de borrado masivo de episodios y acciones masivas (marcar vistos/no vistos, eliminar)
- Nuevas categorias de rating: Direccion, Guion, Produccion, Quimica de pareja principal/secundaria
- Banner de bienvenida para visitantes no logueados en el catalogo
- Parejas de protagonistas ordenadas por numero de grupo
- Banderitas de pais en tarjetas de Universos
- Vista de logs responsive con cards para mobile
- Boton "Limpiar scanners" en la pagina de admin logs

### Fixes
- Notificaciones movidas desde el acceso separado del sidebar al panel de configuracion de usuario
- Correciones de i18n en admin/feedback para nuevas claves de navegacion y seguimiento
- Ajustes de tipado y validaciones para soporte de comentarios en feature requests
- Fix: dialogo "Deseas abandonar el sitio" al editar temporadas (beforeunload falso positivo)
- Fix mobile: boton de perfil en BottomNav ya no cierra sesion por error
- Fix landing: estabilizacion de imagen hero en mobile
- Fix PWA: correccion de manifest para instalacion
- Fix PWA: eliminado `head.tsx` incorrecto que apuntaba a `/manifest.json` (404)
- Fix Next.js 16: route handlers dinamicos de feedback actualizados

### Seguridad
- Filtro de paths de scanners en middleware
- Extraccion de IP real del cliente via `CF-Connecting-IP` (Cloudflare)
- No loguear assets/PWA (icons, manifest, sw.js)
- Endpoint para limpiar logs de scanners
- Endpoints `/api/genres` y `/api/episodes/[id]/view-status` ahora con auth correcta

## 2026-03 — Sitios, suggestions y mantenimiento (deployado)

- Nuevas categorias de sitios: Oficiales, Productoras, YouTube
- Constantes de sitios centralizadas en `src/constants/sitios.ts`
- Modelo `SuggestedSite` y API de sitios sugeridos
- Fix: watchLinks no se cargaban al editar una serie
- Fix: "Currently Watching" ahora filtra por usuario autenticado
- Fix: boton "Editar" en watching solo visible para admin/mod
- Logos/imagenes en cards de sitios
- Thumbnails en tabla admin de contenido embebible
- Deteccion y filtro de contenido duplicado en admin
- Filtros clickeables en logs (usuario, accion, ruta, IP)
- Alineamiento de cards en pagina de contenido
- Limpieza de archivos obsoletos
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
