# Ideas y Roadmap - MundoBL

## Ya implementado

- [x] Nombre de app configurable: `NEXT_PUBLIC_APP_NAME` ya es variable de entorno
- [x] Focal point para imagenes de portada en catalogo
- [x] Pagina de feedback (bugs, features, ideas) con changelog
- [x] Parejas de personajes en el reparto
- [x] Pagina de gestion de usuarios y roles
- [x] Estado de series expandido: Sin ver, Viendo, Vista, Abandonada, Retomar
- [x] Especiales con soporte de temporadas y episodios
- [x] Fix layout de universos con +3 titulos
- [x] Subida de imagenes a Supabase Storage
- [x] Imagenes en feedback via clipboard paste
- [x] Pagina admin de info del proyecto (links por env vars)
- [x] Login con Google OAuth
- [x] Access logs con registro de visitas y acciones
- [x] Panel admin de logs con filtros y limpieza automatica
- [x] Banner de privacidad
- [x] Sistema de ban de usuarios y bloqueo por IP
- [x] Gestion de usuarios mejorada (ban/unban, roles)
- [x] Sitios de interes / Links recomendados (pagina publica + CRUD admin)
- [x] Donde ver (WatchLinks con plataformas + embed de YouTube)
- [x] Contenido embebible (trailers, OSTs, entrevistas desde YouTube)
- [x] Importacion de canales de YouTube
- [x] Contenido embebido en pagina de detalle de serie
- [x] Sistema de chequeo de version (StaleVersionNotifier)
- [x] Nuevas categorias de sitios (oficiales, productoras, youtube)
- [x] Sugerencias de sitios por la comunidad (SuggestedSite)
- [x] Deteccion de contenido duplicado en admin
- [x] Filtros clickeables en logs de admin
- [x] Temporadas unificadas: admin completo de temporadas con SeasonForm + SeasonsList
- [x] Proteccion contra inyeccion: todos los $queryRaw usan tagged template literals de Prisma (parametrizados automaticamente)
- [x] Tracking mejorado en "Viendo Ahora": CurrentlyWatchingDashboard con progreso detallado
- [x] Landing page rediseñada: hero, stats band, features grid
- [x] Notificaciones in-app: modelo, API, campanita, pagina /notificaciones, push opt-in
- [x] Novedades publicas: feed de nuevas series + temporadas + changelog
- [x] Estadisticas avanzadas: dashboard publico + perfil con heatmap, ratings, distribucion por tipo/pais/año
- [x] Command palette global (Cmd+K)
- [x] Preferencias persistidas: catalogo, privacidad por defecto, tema, tipografia
- [x] Export/delete de cuenta
- [x] View Transitions API en catalogo
- [x] PWA: Service Worker + offline indicator + push notifications opt-in
- [x] Observaciones privadas en series (reviews internas)

---

## Pendiente

### Sistema de recomendaciones
Flor como admin podria gestionar recomendaciones.
- Cada usuario decide si acepta recomendaciones o no en su config
- Basado en generos, tags, o curado manualmente por admin

---

## Largo plazo

### Notificaciones por correo
Sistema opt-in de notificaciones:
- El sitio por default NO envia ni consulta
- El usuario registrado voluntariamente activa en su pagina de configuracion
- Sin presion ni obligacion
- Notificacion cuando se resuelve un bug/feature al que se suscribio

### Platformizacion
Hacer la app generica y reutilizable:
- appName y branding por variables de entorno
- Quedaria como una app de gestion de contenido audiovisual personalizable
- Podria subirse como parte de un portfolio en GitHub
- Requiere abstraer las referencias a "BL" y hacerlas configurables

### Busqueda avanzada
Multiples criterios combinados (pais + genero + tag + ano + rating minimo).

### Import/export de datos
Backup y restauracion de datos.

### Modo offline (PWA)
Progressive Web App con cache offline.

---

## Notas

- Correo de Flor (admin): florstratovarius@gmail.com
- Correo de Juan (admin): juanjparedez@gmail.com
