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
