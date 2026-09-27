# Biblioteca y preferencias sincronizadas

Continuación acotada de la PR #87. No incluye chat, múltiples visionados ni cambios de permisos editoriales.

## Implementado en la rama

- Biblioteca privada con todos los estados explícitos de serie: SIN_VER, VIENDO, VISTA, RETOMAR y ABANDONADA. En curso sigue siendo el filtro inicial. El endpoint anterior conserva el contrato usado por los widgets.
- Vista, orden y fijados persistidos por cuenta en User.watchingPreferences. Importación inicial de preferencias locales solo cuando la cuenta aún no tiene preferencias; otro dispositivo no las reemplaza al abrirse.
- Cambios por campo y transacciones Serializable con reintentos. Los fijados se restringen a la biblioteca de la cuenta autenticada. Actualización al abrir o volver a enfocar la pantalla; no se promete sincronización instantánea en pantallas abiertas.
- Aviso y recarga ante fallos de sincronización; controles bloqueados hasta disponer de preferencias confirmadas. Textos nuevos en diez idiomas.
- Ajuste de ficha: póster compacto en móvil, seguimiento en columna principal y acciones separadas. Comprobación visual previa a 320/390/640/768/1024/1440 sin desbordamiento, con datos simulados.

## Evidencia y pendientes de entrega

- Migración 20260926234951_watching_preferences generada y aplicada exclusivamente en PostgreSQL local con migrate dev. Añade una columna nullable a User, que ya tiene RLS; no crea tablas ni altera permisos.
- test-library-preferences.mjs aprobado con SQL real y sesión simulada: cinco estados, aislamiento, DTO sin observaciones editoriales, compatibilidad de endpoint activo, inicialización única, rechazos de payload inválido, concurrencia y preservación de fechas. Agregado al CI.
- TypeScript aprobado; lint de componentes, hook y endpoints modificados aprobado.
- Exportación/importación de preferencias implementada con vista previa, validación estricta y conservación de preferencias existentes. Probada con SQL real: exportación, preview sin escritura, restauración junto al seguimiento, reimportación e inputs inválidos.
- test-watching-preferences-ui.mjs aprobado con hook real y HTTP simulado: dos dispositivos aislados, inicialización única, sincronización al volver, fallos de lectura/escritura y recuperación. test-watching-ui.mjs actualizado y aprobado: búsqueda, progreso, fijados, notas privadas, comentarios, diario, móvil y tema claro.
- Build de producción aprobado contra PostgreSQL local (test-results/library-build.log). Diff sin errores de whitespace. Pendiente publicar y revisar el PR; no declara terminado el objetivo general de producto.
- No desplegado. La migración de esta rama no está aplicada en producción. Aplicarla antes de desplegar el código que consulta la columna; la reparación de la #87 solo aplicó sus dos migraciones.
- El cambio local previo en prisma.config.ts se conserva; revisar su inclusión por separado.
