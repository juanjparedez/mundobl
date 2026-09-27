# Estadísticas personales y catálogo de Flor

Prioridad acordada: estadísticas personales, después panel de Flor, cuidando
rendimiento. La importación queda relegada. #97 está integrada en main.

## Hallazgos y correcciones iniciales

- `/api/user/profile` reúne 23 consultas para perfil, actividad, reseñas y
  favoritos. La página específica de estadísticas no debe depender de toda
  esa respuesta ni recibir datos de notas privadas.
- El gráfico de series completadas usaba el año de estreno. Corregido localmente
  para agrupar por fecha de visionado, excluyendo fechas desconocidas/futuras.
- El calendario muestra 26 semanas pero consultaba 84 días. Corregido localmente
  a 182 días; la racha histórica del perfil conserva su ventana de 84 días.
- Prueba SQL local: años de finalización, aislamiento de cuentas, fechas
  desconocidas/futuras y actividad de hace 100 días. Sin escrituras en producción.

## Primera entrega: estadísticas personales

- Página privada accesible desde seguimiento y perfil.
- Semana, mes y año, con comparación contra un período anterior equivalente.
- Capítulos completos (no partes), series terminadas y tiempo registrado.
- Cobertura explícita: fechas y duraciones desconocidas; no inventar valores
  ni presentar las marcas actuales como historial de múltiples visionados.
- Estado de biblioteca y distribución por país, género y formato, con accesos
  a las series correspondientes.
- Consultas autenticadas específicas; datos agregados y rangos acotados.
- Diseño móvil, estados de carga/error/vacío y traducciones en diez idiomas.
- Verificar partes, límites de períodos, datos faltantes y aislamiento con SQL;
  recorrido de filtros y enlaces en navegador. Medir solicitudes y tamaño de
  respuesta sin atribuir mejoras de tiempo a pruebas que no las midan.

## Segunda entrega: Flor

- Vista editorial del catálogo: cobertura de fichas, datos faltantes y
  distribución por características, con enlaces para corregirlos.
- Actividad agregada de seguimiento, separada del catálogo para ver.
- Respetar permisos existentes y no exponer notas ni historiales individuales.
- Definir el universo y el denominador de cada indicador antes de mostrarlo.

Estas correcciones iniciales no equivalen a entregar las páginas nuevas.

## Bloque preparado para integrar

- Perfil móvil en flujo vertical natural por debajo de 768 px de contenedor:
  conserva el orden del breakpoint móvil y no aplica las alturas manuales de
  las tarjetas al leer. En edición conserva el grid y sus controles.
- Selector global 3/5/10, con 5 por defecto, para las listas AutoFitList del
  perfil. Al cambiarlo se cierran las expansiones anteriores. La preferencia
  se guarda por cuenta en este navegador; no promete sincronización remota.
- Las listas conservan su expansión local para acceder a todos los resultados
  cargados. Los destinos dedicados de estadísticas siguen pendientes.
- Textos nuevos en diez idiomas. Ninguna migración ni cambio de permisos.
- Regresiones de navegador para scroll sobre tarjetas largas, orden móvil,
  alturas manuales de escritorio, cambio global y recarga. Se incorporan a CI.
- Prueba SQL local para año de visionado, actividad de 100 días y aislamiento.

Quedan para entregas posteriores: página personal por períodos, panel editorial
de Flor, quiz/palabra del día opcionales y vista previa de audiencia de avisos.
El esquema actual no tiene país ni edad de usuario; no inferirlos del consumo.

## Entrega por períodos (siguiente PR)

- Nueva página privada `/perfil/estadisticas`, enlazada desde perfil y seguimiento.
- Últimos 7/30/365 días (calendario UTC, incluye hoy en curso), comparados con
  el bloque anterior de igual cantidad de días. No son semanas/meses calendario.
- Capítulos completos según todas las partes registradas y fecha de la última;
  series terminadas según su marca explícita y minutos de partes vistas con
  duración conocida. No reconstruye ni cuenta rewatchs múltiples.
- Actividad por serie con enlaces y paginación de diez filas, sin scroll interno.
- Cobertura desplegable: marcas de series/videos sin fecha válida en toda la
  biblioteca y videos del período sin duración. No se inventan fechas ni minutos.
- API privada específica: tres operaciones Prisma, sin cargar perfil, reseñas,
  favoritos, comentarios ni notas. Selecciona temporadas con actividad fechada
  en los dos períodos y conserva todas las partes hermanas para contar bien.
  El período máximo consultado es 730 días; la respuesta contiene agregados por
  serie, no episodios. La paginación de estas filas es de presentación.
- Diez idiomas, carga/error/reintento/vacío y controles móviles de 44px.
- Regresión pura para fechas/partes/duraciones; prueba real de API + PostgreSQL
  local para autenticación y aislamiento; navegador con datos ficticios para
  error/reintento, períodos, enlaces, paginación y desbordes. Agregadas a CI.
- Sin migraciones. No se ejecutaron escrituras en producción ni se midió LCP.

Pendientes explícitos: distribuciones por país/género/formato y estado de toda
la biblioteca; panel editorial de Flor; quiz/palabra del día; audiencia de
notificaciones. Esta entrega no cierra el plan completo de estadísticas.


## Distribución de la actividad personal

- País de la obra, género, tipo (serie/película/corto/especial) y formato
  (horizontal/vertical), dentro del período seleccionado de estadísticas.
- Denominador: obras únicas con actividad en ese período. Cada obra aporta
  una vez por categoría, independientemente de sus capítulos o minutos.
  Los géneros pueden superar 100 % al sumarse; se explica en pantalla.
- Los datos ausentes aparecen como «Sin dato». No se infiere país del usuario.
- Barras y cantidades accesibles; cinco categorías iniciales por panel con
  despliegue del resto. Pulsar una categoría filtra las obras de abajo y mueve
  el foco al resultado; permite quitar el filtro y conserva los enlaces.
- Cambiar período reinicia filtro y paginación. Totales/comparación mantienen
  el alcance del período completo, tal como explica el texto del filtro.
- Metadatos seleccionados en la consulta privada existente, sin pedir el perfil
  completo, notas o comentarios. Traducciones de controles en diez idiomas;
  géneros usan los nombres editoriales del catálogo.
- Regresiones: obras únicas, géneros múltiples/duplicados, datos desconocidos,
  filtrado móvil y metadatos en la API con aislamiento entre cuentas.

Quedan pendientes el estado global de toda la biblioteca, el panel editorial
para Flor, quiz/palabra del día, audiencia de notificaciones y mediciones de
rendimiento en producción. Esta entrega describe actividad del período, no
la composición de toda la biblioteca.
