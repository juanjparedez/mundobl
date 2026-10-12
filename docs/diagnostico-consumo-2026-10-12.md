# Consumo y validaciones — 12/10/2026

## Conclusión y alcance

Vercel supera las cuotas Hobby de CPU activa y escrituras ISR en la ventana consultada. Supabase no supera las cuotas mostradas en su ciclo actual. La cantidad de registros no permite concluir que sea necesario migrar o contratar otro plan.

Diagnóstico de solo lectura: no se cambiaron cuotas, planes, infraestructura, notificaciones ni configuración pública de patrocinio. Las optimizaciones siguientes son propuestas pendientes de implementación. Complementa el [plan integral](plan-calidad-sostenibilidad-2026-10-12.md).

## Fuentes y períodos

- [Vercel Usage](https://vercel.com/juanjparedezs-projects/~/usage): equipo Hobby, único proyecto `mundobl`, filtro Last 30 Days; intervalo visible «Sep 11, 11 p. m. - Oct 11, 11 p. m.». Se transcribe la etiqueta del panel sin inferir su zona horaria. El resumen de la portada usa otro corte y no se mezcló con estos valores.
- [Vercel Functions](https://vercel.com/juanjparedezs-projects/mundobl/observability/vercel-functions?environment=all) e [ISR](https://vercel.com/juanjparedezs-projects/mundobl/observability/isr?environment=all): últimas 12 horas, todos los entornos; etiqueta visible al recoger funciones «Oct 11, 2:11 p. m. - Oct 12, 2:11 a. m.». Hobby no permitió ampliar esa observabilidad. Incluye despliegue y pruebas propias: no equivale a tráfico exclusivamente de usuarios.
- [Supabase Usage](https://supabase.com/dashboard/org/hfmgucabfsyvlkddjiny/usage): organización devsolutions, Free, ciclo 17/09/2026–17/10/2026, todos los proyectos.
- Código del repositorio y lectura SQL de producción dentro de transacción READ ONLY, con timeout. No se consultaron historiales personales para analizar consumo.

Las ventanas de ambos proveedores son distintas. Los valores son una captura, no un monitoreo continuo ni una proyección de fin de ciclo.

## Vercel: cuotas observadas

| Recurso | Uso | Incluido Hobby | Interpretación |
| --- | ---: | ---: | --- |
| Fluid Active CPU | 8 h 29 min | 4 h | Aproximadamente 212 %; excedido |
| ISR Writes | 311.224 | 200.000 | 156 %; excedido |
| ISR Reads | 354.616 | 1.000.000 | 35 % |
| CDN Requests | 797.291 | 1.000.000 | 80 % |
| Fast Origin Transfer | 7,57 GB | 10 GB | 76 %; 7,16 GB de salida |
| Fast Data Transfer | 18,69 GB | 100 GB | 19 % |
| Function Invocations | 291.434 | 1.000.000 | 29 % |
| Fluid Memory | 80,7 GB-h | 360 GB-h | 22 % |
| Build Time | 7 h | 100 h | 7 % |
| Image Transformations | 455 | 5.000 | 9 % |
| Image Reads / Writes | 995 / 661 | 300.000 / 100.000 | Muy por debajo |
| Web Analytics Events | 14.013 | 50.000 | 28 % |

La comparación con Pro que muestra el panel no es cuota Hobby: no usar 16 h como límite gratuito de CPU. El detalle atribuye las 8 h 29 min al proyecto mundobl.

El gráfico diario muestra visualmente un descenso desde fines de septiembre, después de un pico cercano al 27/09. No se extrajeron valores diarios exactos ni se demuestra causalidad con un cambio concreto. No extrapolar las últimas 12 horas al mes ni atribuir el acumulado completo a la versión recién desplegada.

### Funciones en las últimas 12 horas

1,8 K invocaciones; errores y timeouts 0 %. CPU activa P75 176 ms, TTFB P75 211 ms, cold starts 10,6 %, CPU throttle P75 36,5 %. Son agregados del panel, no una prueba de saturación permanente.

| Ruta | Invocaciones | CPU total |
| --- | ---: | ---: |
| /api/announcements/active | 257 | 22 s |
| /api/auth/[...nextauth] | 490 | 22 s |
| /series/[id] | 24 | 17 s |
| /comunidad/obras/[id] | 159 | 16 s |
| /api/series/[id]/comments | 86 | 14 s |
| /api/reviews | 173 | 14 s |
| /api/series/[id]/user-ratings | 91 | 13 s |
| /api/seasons/[id]/comments | 82 | 11 s |
| /api/contenido | 86 | 10 s |
| /api/notifications/unread-count | 63 | 8 s |
| /api/novedades/latest | 43 | 8 s |

La ruta agrupada de Auth.js incluye varios handlers; sus 490 llamadas no demuestran por sí solas 490 lecturas de sesión redundantes. El código ya desactiva refetchOnWindowFocus. El hook useActiveAnnouncements hace una petición por cambio de pageKey, sin polling. Novedades/latest ya tiene caché de una hora: no proponerla como una carencia.

### ISR: peso además de frecuencia

El panel muestra 7,5 K unidades leídas y 1,7 K escritas; 23 revalidaciones por tiempo y una por tag. Se seleccionó **Units**, no Count. Una regeneración puede escribir muchas unidades: no confundir solicitudes con unidades facturables.

| Ruta | Unidades escritas |
| --- | ---: |
| /catalogo | 411 |
| /catalogo.segments/_full.segment | 254 |
| /catalogo.segments/!KGFwcCk/catalogo/__PAGE__.segment | 252 |
| /series/[id] | 367 |
| /directores/[id] | 62 |
| /ver/[id] | 58 |
| /actores/[id] | 42 |

Las tres entradas principales del catálogo suman **917 unidades**, aproximadamente 54 % del total redondeado de 1,7 K. Es una atribución reciente comprobada, no el porcentaje mensual. El catálogo ya usa revalidación de seis horas y caché de datos; revisar payload e invalidaciones antes de agregar otra capa de caché.

Las mediciones públicas del plan integral confirman 2.023.685 bytes de HTML descomprimido en catálogo, incluidos 405.332 bytes de CSS inline. La ficha tiene 507.238 / 287.903 bytes y /ver 383.358 / 220.501 bytes de HTML / CSS. Las tres lecturas fueron HIT. Estos tamaños no equivalen a transferencia facturada, pero respaldan reducir datos serializados y estilos repetidos.

## Supabase: ciclo actual sin excesos

| Recurso | Uso / cuota | Porcentaje mostrado |
| --- | ---: | ---: |
| Egress | 2,166 / 5 GB | 43 % |
| Cached Egress | 0,282 / 5 GB | 6 % |
| Database Size | 0,126 / 0,5 GB | 25 % |
| Storage | 0,11 / 1 GB | 11 % |
| Log Ingestion, Upcoming | 0,702 / 1 GB | 70 % |
| Log Query, Upcoming | 1,649 / 100 GB | 2 % |

Overage mostrado: cero. Logs figura como Upcoming, con aplicación posterior al período de gracia que comienza en 2027 según el texto del panel; no tratarlo como exceso cobrado actual.

El banner «Grace period is over» informa que terminó la gracia el 10/09 y que agotar cuota puede impedir servir solicitudes. No afirma que una cuota esté excedida ahora. No se obtuvieron los correos originales de aviso: no podemos atribuir cada aviso histórico a una métrica específica.

Supabase Auth muestra cero MAU porque la aplicación utiliza Auth.js; no significa cero usuarios de MundoBL. La portada llegó a mostrar Unhealthy y, en la lectura posterior, Healthy, CPU 3 %, RAM 51 %, disco 6 %, 11/60 conexiones y éxito 100 % en su ventana de 60 minutos. No se identificó la causa del estado transitorio ni se infiere disponibilidad histórica perfecta.

SQL instantáneo: pg_database_size de 110.578.835 bytes. Puede diferir del tamaño agregado del panel por alcance/unidades/momento. Los contadores pg_stat_database fueron reiniciados el 08/12/2025: no corresponden al ciclo actual. Las tablas con muchos escaneos secuenciales son pequeñas; ese contador acumulado no justifica agregar índices sin planes y tiempos de consultas representativos.

## Accionables ordenados

| Prioridad | Acción / esfuerzo orientativo | Resultado esperado | Verificación | Estado |
| --- | --- | --- | --- | --- |
| P1.1 | Reducir datos iniciales del catálogo; sinopsis a demanda y representación compacta de etiquetas. Medio. | Menos bytes HTML/RSC y unidades ISR por regeneración, preservando búsqueda/filtros/vista rápida. | Comparar bytes descomprimidos y transferidos, unidades por escritura, funcionamiento y latencia; misma muestra y caché comparable. | Propuesta respaldada por 917 unidades recientes; pendiente |
| P1.2 | Extraer/reutilizar CSS SSR de Ant Design con solución compatible con Next 16 y skins. Medio/alto. | Evitar cientos de KB repetidos por página sin perder estilos iniciales ni temas. | Presupuesto CSS/HTML antes/después; todos los skins, responsive, hidratación, estilos sin parpadeo y caché de assets. | Medición confirmada; investigar implementación antes de cambiar |
| P1.3 | Auditar llamadas de anuncios y Auth.js por navegación y montaje. Bajo/medio. | Eliminar duplicados demostrados; cachear candidatos públicos de anuncios cuando corresponda. | Solicitudes por recorrido anónimo/autenticado; CPU por ruta en ventanas comparables; pruebas de audiencias y actualización al editar. | Rutas prioritarias identificadas; duplicación causal aún por medir |
| P2.1 | Revisar carga de reseñas, comentarios y ratings; diferir solo lo que no necesita mostrarse inicialmente. Medio. | Menos funciones/consultas por apertura conservando información útil y accesibilidad. | Medir waterfall y llamadas antes/después; probar navegación, expansión y escritura/actualización. | Hipótesis para reproducir |
| P2.2 | Comparar consumo diario después de una entrega con tráfico y revalidaciones. Bajo. | Separar mejora real, variación de tráfico y acumulado anterior. | Registrar muestras manuales con período, versión, entornos, CPU, ISR y transferencia; sin polling ni avisos extra. | Línea de base guardada; nueva muestra tras la mejora |
| P2.3 | Revisar egreso y logs de Supabase si aumentan; atribuir pooler/SQL/storage con datos del mismo período. Bajo/medio. | Evitar optimizaciones o migraciones sin presión comprobada. | Consumo por servicio y consultas medidas; no índices por seq_scan ni limpieza por intuición. | Sin exceso actual; pendiente condicional |

No cachear globalmente respuestas personalizadas de anuncios, sesión, permisos o datos privados. El endpoint de anuncios consulta candidatos y resuelve audiencias/saludo por usuario: una optimización debe separar esas responsabilidades sin filtrar información entre cuentas. No aumentar TTL ciegamente ni quitar autenticación para bajar CPU.

No se promete una reducción porcentual mensual: hace falta implementar una mejora acotada y repetir la medición. Los datos actuales permiten priorizar, no certificar ahorro futuro.

## Validaciones adicionales de esta sesión

| Prueba | Entorno y resultado |
| --- | --- |
| Visor móvil | Producción en Chrome con viewport solicitado 390×844 y clientWidth medido 382 por scrollbar. Decoding you externo: apertura con Enter, zoom, reducción, arrastre, Escape y retorno del foco confirmados. No certifica pinch táctil en un teléfono físico. |
| Compartir ficha y /ver | Producción: modal alternativo, WhatsApp preparado con frase breve, URL canónica y UTM; sin sinopsis. No se enviaron mensajes. |
| Copiar | Campo contiene solo URL con UTM de copia; botón muestra «Enlace copiado». La lectura independiente del portapapeles del navegador devolvió vacío, por lo que no se certifica su contenido mediante esa lectura. El payload de copia fue probado en fixture local anteriormente. |
| Diálogo nativo real | Pendiente. Juan indicó que no puede probarlo ahora. El fixture comprueba payload y AbortError, pero no reemplaza una hoja nativa real. |
| Publicar/editar borrador/ocultar con caché HTTP | Pendiente. SQL y handler con llamadas de caché simuladas pasan, pero el arranque de Next local fue rechazado nuevamente por la revisión automática, sin motivo específico. No se intentó eludirla ni publicar datos de prueba en producción. |

No se cerraron automáticamente reportes ni se enviaron avisos. Patrocinio permanece oculto. No hubo cambios de aplicación ni nuevo despliegue durante este diagnóstico.
