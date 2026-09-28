# Comunidad: listas, pertenencia y control

Entrega posterior a #103, en un único PR. El contrato completo está en [el plan](comunidad-pertenencia-plan.md).

## Experiencia

- Listas ordenadas y Top 5, notas con spoilers, vista previa, publicación explícita, enlace público, retirada y borrado. Se crean privadas.
- Perfil público opt-in, presentación y foto opcional. El historial y las preferencias personales no se muestran. La invitación al Top 5 puede posponerse o descartarse, sin modal obligatorio ni publicación automática.
- Conversaciones desde una obra o capítulo, borradores editables, publicaciones propias y seguidas. Avisos de respuestas opt-in y silencio por conversación. Recomendaciones adjuntas que pueden guardarse en pendientes sin reemplazar progreso existente.
- Denuncia y bloqueo en listas, perfiles, temas y respuestas. Administración permite revisar denuncias, ocultar/restaurar con motivo e historial y pausar funciones. No permite inspeccionar borradores privados.
- Métricas de conversaciones, respuestas, listas y pedidos sin respuesta, con alcance público explícito. No son estadísticas de visitas.
- Exportación propia e importación privada de listas, temas y presentación. La importación no restaura respuestas, seguimientos, bloqueos, denuncias ni permisos de publicación/avisos; el texto lo explica antes de importar.

## Verificación

- PostgreSQL local: permisos y aislamiento, bloqueos, límites concurrentes, revisión de listas, publicación/retirada, opt-in, moderación/auditoría, métricas e importación idempotente.
- Navegador con APIs/componentes reales: listas, orden, spoilers, perfil y Top 5; conversaciones, seguimiento y moderación. Sesión y navegación adaptadas en estas pruebas de componentes.
- Navegador con servidor Next de producción y AppLayout real: sesión JWT, creación privada/publicación/retirada, recomendaciones, denuncia/moderación, borrador desde capítulo y pantallas a 1280/390 px. No sustituye una prueba de Google OAuth ni de entrega push/email externa.
- Migraciones completas reproducidas en una base vacía; backup/restauración de 75 tablas comparado, incluyendo los ocho modelos nuevos, relaciones y secuencias.
- Build de producción y TypeScript aprobados. ESLint focalizado limpio; lint global sin errores y con advertencias preexistentes.
- CI ejecuta las regresiones y el recorrido con servidor Next real. Revisar su resultado remoto antes del merge.

## Orden de entrega

1. Revisar el PR y esperar CI verde.
2. Crear un backup actual de producción con el schema anterior, antes de modificarlo. El backup ampliado de esta rama requiere las tablas nuevas y no sirve para el respaldo previo hasta aplicar la migración.
3. Aplicar únicamente migraciones versionadas con `migrate deploy`, incluida `20260928005043_community_belonging`. Nunca `migrate dev` ni `db push` en producción. La migración es aditiva, preserva temas existentes como públicos y habilita RLS en las tablas nuevas.
4. Mergear a main; el despliegue automático queda activo. Solo el preview de `codex/comunidad-pertenencia` está deshabilitado.
5. Comprobar sitio público, acceso privado y panel de comunidad después del despliegue. Las pruebas locales no acreditan este paso.

Estado inicial de esta entrega: migración aplicada solo en local; no se ha desplegado este código ni aplicado la migración a producción.
