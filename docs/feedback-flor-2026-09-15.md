# Revisión del feedback de Flor — 15/09/2026

## Cambios preparados

| Solicitud                | Resultado                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| #165 Vistas              | Lista completa desde el perfil, modal con páginas de 20 y vista previa de tres títulos.                                                   |
| #164 Botones amontonados | Separación y ajuste de línea en notas de series y episodios; fecha separada del contador.                                                 |
| #163 Dónde ver duplicado | La ficha pública conserva un único bloque de plataformas.                                                                                 |
| #162 Basado              | Pendiente de explicación editorial; GM, Manga y los datos existentes siguen intactos.                                                     |
| #161 Filtros: Estado     | Retomar y Abandonadas, con estados del usuario autenticado.                                                                               |
| #160 Plataformas         | Doramasflix agregada al selector del formulario.                                                                                          |
| #159 Visual              | Etiquetas de información de 160px en escritorio para acercar los valores.                                                                 |
| #158 Temporadas          | Cuenta miembros de tipo serie del universo e indica la posición de la ficha. Excluye películas, especiales y aportes fuera del catálogo.  |
| #157 Universos: portada  | Casilla de historia principal y portada, confirmada por el usuario. Una principal por universo; se prioriza en las tarjetas del catálogo. |
| #156 Spotify             | Ya estaba disponible en el formulario y en los enlaces públicos. Verificado con una ficha de prueba.                                      |

La posición de temporada usa historia principal, año, título e ID. La sección de episodios conserva las temporadas internas de cada ficha. Las traducciones nuevas están en los diez idiomas.

La propuesta de XUXYN requiere una decisión del equipo. El proyecto ya tiene rol COLLABORATOR, asignación manual por ADMIN, importador y panel de aportes propios. No se envió ninguna respuesta externa ni se cambió el estado de las solicitudes.

## Reconciliación de Prisma

Se confirmó que el script anterior de Supabase usaba `db push` y que el drift ya estaba documentado en agosto. Faltaba registrar dos tablas y seis columnas existentes en producción.

- Se reconstruyó el historial en PostgreSQL local y se generó `20260915110000_reconcile_untracked_schema` desde la diferencia real.
- Se verificaron los cambios contra producción y se registró la migración con `migrate resolve --applied`, siguiendo el [procedimiento de Prisma para hotfixes](https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing).
- Las huellas del esquema, índices, RLS y filas de las siete tablas afectadas fueron idénticas antes y después de reconciliar.
- Se aplicó por separado `20260915120000_universe_main_story`, una adición con valor inicial false y restricciones de integridad.
- El comando de Supabase ahora usa `migrate deploy`. La configuración bloquea `migrate dev/reset` y `db push` contra hosts remotos.
- El workflow de PR reconstruye una base vacía y compara el resultado con `schema.prisma` para detectar migraciones faltantes.

La comprobación final de Supabase mostró 46 migraciones aplicadas, ninguna pendiente y ninguna diferencia de esquema. Las 644 series conservaron todos sus campos anteriores.

## Verificación

- Dos reconstrucciones locales; historial final de 46 migraciones sin diferencias de esquema.
- Pruebas de concurrencia, reversión de transacciones, portada, scope público y estados por usuario.
- Navegador: 25 vistas accesibles, segunda página, filtros, un solo bloque de plataformas, información compacta y botones de notas a 375px.
- API local: persistencia de la marca principal y respuestas completas de perfil y estados.
- TypeScript y build de producción correctos, usando la base local de pruebas.
- ESLint sin errores; los locales mantienen avisos de formato previos. Sin la regla de formato, los archivos modificados pasan con cero avisos.

El código queda en el workspace; no se publicó una versión web. Las rutas temporales de autenticación y visualización de pruebas fueron eliminadas.
