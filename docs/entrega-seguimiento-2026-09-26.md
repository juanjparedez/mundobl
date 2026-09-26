# Entrega de seguimiento, comunidad y créditos

Esta entrega integra el trabajo acumulado en un único PR. No declara terminado el objetivo de producto. La visión completa está en [el plan](vision-producto-seguimiento-2026-09-26.md); este documento delimita lo que entra y lo que falta, sin seguir ampliando el alcance.

## Incluido

- `/watching`: búsqueda, filtros, orden, lista/tarjetas, fijados por cuenta y dispositivo; drawer de episodios, notas privadas y acceso a comentarios públicos existentes.
- Historial privado de cambios de seguimiento, paginación, búsqueda y borrado independiente del progreso. Fechas corregibles de series, temporadas y episodios; fechas desconocidas preservadas. El historial no equivale a múltiples visionados.
- Exportación/importación personal con vista previa, referencias validadas, identidad tomada de la sesión y restauración que agrega lo faltante sin pisar datos existentes.
- Estadísticas basadas en fechas de visionado, capítulos completos y duraciones registradas, con cobertura desconocida explícita.
- Comunidad: entrada visible y feed de reseñas públicas, búsqueda/paginación y protección de títulos con spoilers. No incorpora chat.
- Catálogo y `/ver`: destinos coherentes, metadata sin prometer reproducción donde solo existe ficha; aportes limitados a referencias editoriales existentes y propiedad del colaborador.
- Guionistas: modelo independiente, fuentes por crédito, ficha e índice públicos y enlaces desde obras. Sin editor ni nombres/créditos inventados.
- Respaldo global de las 65 tablas, incluyendo historial y guionistas; recuperación ensayada localmente.

## Pendiente, fuera de este PR

1. Decidir control editorial exclusivo de Flor versus delegación a ADMIN. Los permisos generales ADMIN/MODERATOR existentes no se rediseñan en esta entrega; no afirmar exclusividad completa todavía.
2. Editor de guionistas/créditos, propuestas y aprobación de nuevas entidades; ampliar fotos y referencias con fuentes verificadas.
3. Múltiples vueltas de visionado, biblioteca completa y sincronización de preferencias entre dispositivos.
4. Importación que permita modificar marcas existentes con revisión de conflictos; actualmente prevalece lo ya guardado.
5. Conversaciones/recomendaciones sociales, controles de contacto y eventual chat. No exponer notas privadas al habilitar funciones sociales.
6. Descubrimiento explicable por afinidad de contenido y carga editorial BL/GL verificable, sin publicidad ni promesas falsas.
7. Recorrido OAuth/HTTP autenticado con datos reales, medición con bibliotecas grandes y auditoría completa de superficies públicas.

## Compatibilidad y migración

Las dos migraciones son aditivas: `20260926192040_tracking_event_history` y `20260926204755_writer_credits`. No borran las marcas existentes. El historial inicial se etiqueta SNAPSHOT, no como acciones históricas inventadas. El trigger captura cambios nuevos dentro de la misma transacción.

Aplicar las migraciones versionadas **antes** de desplegar este código: el código anterior sigue funcionando con las tablas nuevas, pero el nuevo necesita esas tablas. Respaldar antes. Usar `prisma migrate deploy`, nunca `migrate dev`, reset o db push sobre la base compartida. Si se revierte el código, conservar las tablas aditivas y los datos; no ejecutar una migración destructiva de vuelta.

## Verificación

Las pruebas SQL usan PostgreSQL local descartable. Las pruebas visuales usan componentes reales y APIs/sesión simuladas: no demuestran OAuth. El workflow `Tracking integration` reproduce regresiones SQL y build; los workflows existentes verifican migraciones y restauración. Ver [procedimiento y límites](seguimiento-pruebas-locales.md).

Antes de mergear, exigir build y controles del PR aprobados, confirmar migraciones del entorno compartido y revisar el diff final. La disponibilidad real de videos externos puede variar y no se garantiza con estas pruebas.

### Cierre de verificación local

- Build final aprobado con PostgreSQL local activo; lint sin errores, ocho avisos preexistentes fuera del alcance.
- Regresiones SQL de progreso, historial, importación, fechas, estadísticas, privacidad y guionistas aprobadas. Índice público comprobado con búsqueda por alias y exclusión de personas sin créditos visibles.
- El ensayo de restauración comparó las 65 tablas; la UI se comprobó con APIs simuladas. OAuth sigue pendiente y no se declara cubierto.
- La base compartida tiene pendientes exactamente las dos migraciones de este PR. No aplicadas al preparar el PR. El respaldo previo de esa base requiere autorización explícita para copiar datos privados al destino local; la revisión automática lo rechazó. No confundir las pruebas locales de restauración con un respaldo de producción.
