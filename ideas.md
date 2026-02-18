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

---

## Proximas (corto plazo)

### Sitios de interes / Links recomendados
Seccion publica con sitios curados por Flor relevantes al genero BL.
- Modelo `RecommendedSite`: nombre, URL, descripcion, categoria, imagen/favicon, orden
- Categorias: fuente de info, comunidad, noticias, streaming, etc.
- Pagina publica para mostrarlos (cards con links)
- CRUD admin para gestion
- Sirve como retribucion a sitios de los que se toma informacion

### Donde ver (plataformas + video embed)
Agregar plataformas de streaming donde ver cada serie.
- Modelo `WatchLink`: seriesId, platform (enum/string), url, tipo (oficial/no oficial)
- Si es YouTube: embeber el player en la pagina de detalle
- Para otras plataformas (Viki, iQIYI, WeTV, etc.): mostrar link con logo
- Gestion desde el formulario de edicion de serie
- Cuidar aspectos legales: solo embeber contenido oficial

### Temporadas unificadas
Cuando una serie tiene mas de una temporada pero no es un Universo, poder unificarlas.
- Tarea pendiente de Flor (id 15 en feedback)

### Revision de proteccion contra inyeccion
Revisar campos de entrada manual para prevenir inyeccion SQL u otros ataques.
- Tarea pendiente en feedback (id 3)
- Prisma ya previene SQL injection por parametrizacion, pero revisar inputs raw si existen

---

## Mediano plazo

### Landing page
Como no es obligatorio loguearse, crear una landing page atractiva.
- Imagen que paso Flor como hero
- Call to action para explorar el catalogo
- Breve descripcion del sitio

### Tracking mejorado en "Viendo Ahora"
Ahora que tenemos WatchStatus enum, mejorar la pagina Viendo Ahora:
- Tracking mas detallado del progreso
- Siguiente episodio a ver
- Historial de lo visto recientemente

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

### Estadisticas avanzadas
Dashboard con:
- Top-rated por pais, genero, año
- Trending (mas vistos recientemente)
- Distribucion por pais, tipo, estado

### Busqueda avanzada
Multiples criterios combinados (pais + genero + tag + año + rating minimo).

### Import/export de datos
Backup y restauracion de datos.

### Modo offline (PWA)
Progressive Web App con cache offline.

---

## Notas

- Correo de Flor (admin): florstratovarius@gmail.com
- Correo de Juan (admin): juanjparedez@gmail.com
