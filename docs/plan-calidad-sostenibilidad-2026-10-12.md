# Calidad, confianza y sostenibilidad — 12/10/2026

## Contexto y decisiones

Flor reportó el 9/10 que quiere ampliar el póster de una ficha y hacer zoom, y que compartir por WhatsApp pega toda la sinopsis. La ficha y /ver pasan actualmente `synopsis` al ShareButton; la tarjeta social ya tiene una descripción breve. Reutilizaremos el botón y el visor de Ant Design.

La captura del panel muestra 163 registros, 80 series en curso únicas y 29 completadas en la semana. No son 163 usuarios activos, ni 80 personas, ni evidencia de retención. La preocupación por haber defraudado a quienes no vuelven es una hipótesis emocional comprensible, no una conclusión demostrada. Los reportes concretos son una oportunidad de escuchar y devolver mejoras verificadas.

Objetivos: confianza, utilidad, regreso, eficiencia y sostenibilidad. Reutilizar antes de ampliar la superficie del producto. El seguimiento, historial, diario, comunidad y avisos optativos ya existen: revisar su recorrido antes de inventar otro sistema.

Inicialmente se postergaron los ingresos. Ante avisos reiterados de Vercel/Supabase se aprobó construir patrocinio ahora, pero oculto al público. Flor decide los textos, los medios y cuándo publicar. Juan confirmó que ADMIN_EMAILS contiene solamente sus dos cuentas. No crear notificaciones extra, campañas, pedidos insistentes, ventajas por pagar ni exposición automática de aportantes. Usar el sitio sin participar también es válido; el apoyo no económico tiene valor y no es obligatorio.

## Accionables y aceptación

| Prioridad | Acción                    | Resultado y verificación                                                                                                  | Estado                                     |
| --------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| P0        | Conservar contexto        | Documento y enlace desde context.md; separar propuestas de hechos                                                         | Documentado                                |
| P1        | Compartir                 | Mensaje breve traducido + URL canónica/UTM; nativo, WhatsApp y copia sin sinopsis ni envío real                           | Pendiente                                  |
| P1        | Ampliar póster            | Original a demanda, zoom/desplazamiento/cierre/foco; móvil y escritorio; fallo y ausencia de imagen                       | Pendiente                                  |
| P1        | Patrocinio                | Administración exclusiva, mock inactivo, borrador separado de publicación, concurrencia, RLS y respaldo; desplegar oculto | Pendiente                                  |
| P1        | Cuotas                    | Identificar servicio, recurso, período, límite y consumo reales; ordenar ahorro por evidencia y esfuerzo                  | Diagnóstico pendiente de métricas actuales |
| P2        | Métricas                  | Separar equipo y usuarios, personas y obras, modificaciones y finalizaciones; documentar cobertura                        | Auditoría inicial                          |
| P2        | Regreso                   | Revisar descubrir → seguir → registrar → retomar; elegir mejoras por obstáculos observados                                | Pendiente                                  |
| P3        | Alianzas                  | Conservar propuesta XUXYN como oportunidad; sin contacto ni acuerdos automáticos                                          | Idea por evaluar                           |
| P3        | Ingresos y reconocimiento | Registro privado por moneda y agradecimiento público solo con consentimiento                                              | Fuera de esta entrega                      |

## Hallazgos de diagnóstico

El panel cuenta completadas usando ViewStatus.updatedAt; esto no prueba cuándo terminó un visionado. El total de usuarios excluye baneados pero incluye equipo. La lista de activos usa actividad mutable de varias tablas y está limitada a 20; no es un total de activos ni cohortes de regreso. TrackingEvent ofrece recordedAt y watchedDate separados, admite snapshots/importación/borrado: no equivale a visitas ni cubre lectores anónimos. PAGE_VIEW del proxy solo registra /admin. No inferir retención de estos datos ni enviar historial privado a analítica externa.

Las mediciones históricas del 1/10 indicaban HTML/CSS pesado de Ant Design y datos voluminosos en catálogo. Deben medirse nuevamente. No asumir cuotas actuales ni necesidad de migrar por cantidad de series o registros. Patrocinio no reduce consumo por sí mismo. No contratar servicios ni ejecutar cambios de infraestructura dentro de este trabajo.

## Patrocinio aprobado

/apoyar y /admin/patrocinio. Desactivado por defecto, preview privada para ADMIN + ADMIN_EMAILS, mock sin destinos reales. Textos editoriales y medios HTTPS/transferencia configurables, guardar borrador, publicar versión y ocultar. Publicar exige contenido y medio completo. Nada de credenciales, pagos integrados, montos sugeridos, beneficios, ingresos registrados ni lista de patrocinadores. Reconocimiento futuro requiere consentimiento; no prometer anonimato del proveedor ni vincular cuentas por suposición.

## Evidencia de entrega

La documentación no certifica implementación. Registrar aquí controles locales, comprobaciones en producción y límites por separado. No cerrar reportes ni enviar avisos por tener código escrito.

Borradores de resolución (no enviados): Compartir — «Ahora el mensaje preparado incluye una recomendación breve y el enlace, sin pegar la sinopsis». Imagen — «El póster de la ficha permite abrir el original, ampliarlo y moverlo». Usarlos solo después de comprobar la entrega publicada.

## Verificación local — 12/10/2026

- Implementados compartir breve con rutas canónicas, visor de póster y patrocinio privado por defecto. Los reportes permanecen pendientes de comprobación publicada.
- `npm run type-check`: correcto. `npm run lint`: cero errores; ocho advertencias preexistentes en tags, glosario y email.
- Build de producción contra PostgreSQL local: compilación, TypeScript y generación de 177 páginas correctas. `/apoyar` conserva render estático; administración es dinámica. El build final tras los ajustes de textos y controles también terminó correctamente.
- `scripts/test-support-database.ts`: permisos incluyendo baneado y ADMIN fuera de lista; validación; rollback; aislamiento de borrador; publicar/ocultar; conflicto concurrente real; RLS.
- `scripts/test-support-route.mjs`: handler real + SQL real, sesión y llamadas de caché simuladas. Verifica 401/403/400/409, origen de escritura, respuesta privada y expiración inmediata solicitada a Next. No certifica la caché HTTP real de Next.
- `scripts/test-backup-restore.ts`: 77 tablas idénticas tras restauración, incluyendo borrador y snapshot publicado de SupportSettings. `npm run db:check`: sin diferencias de schema.
- `scripts/test-image-delivery.ts`: política de entrega de imágenes externas correcta.
- Navegador integrado contra `scripts/quality-ui-fixture.mjs` (API simulada, sin pagos): mock inactivo, edición/guardado/publicación/ocultación; visor con zoom, desplazamiento, Escape, retorno del foco y error de imagen; payload nativo breve, enlace preparado de WhatsApp y copia; cancelación nativa sin error. Escritorio y ancho móvil de 390 px. No se envió ningún mensaje.
- La revisión automática de seguridad bloqueó arrancar Next local con la configuración de autenticación de prueba, también restringido a 127.0.0.1, sin motivo específico. No se dio por verificado el ciclo HTTP completo ni se agregó un bypass de autenticación al producto.

## Medición pública actual (HTML descomprimido)

Tres lecturas sin sesión, todas HTTP 200 y X-Vercel-Cache HIT:

| Ruta                     | HTML bytes | CSS inline bytes |
| ------------------------ | ---------: | ---------------: |
| /catalogo                |  2.023.685 |          405.332 |
| /series/717-decoding-you |    507.238 |          287.903 |
| /ver/676-step-by-step    |    383.358 |          220.501 |

Son bytes descomprimidos de respuestas concretas, no transferencia facturada ni cuotas. Confirman que extraer CSS repetido y reducir el payload del catálogo merecen un siguiente cambio medido. El HIT observado impide atribuir estas solicitudes a ejecución de funciones sin otras métricas.

Orden del próximo diagnóstico: (1) recurso/período de los avisos actuales, aún no disponibles; (2) atribución de consumo por endpoint/job/build; (3) presupuesto antes/después para CSS y catálogo; (4) revisar egreso legacy de Supabase según evidencia actual. El conector Vercel devolvió 403 en esta conversación; no tenemos métricas actuales de la cuenta. No se dispone de avisos actuales de Supabase, por lo que el exceso concreto sigue sin identificar.

Para métricas de producto, el siguiente cambio debe mostrar personas con actividad significativa agregada en 7/30 días separando equipo, junto a definiciones y límites. Un análisis de regreso requiere eventos fechados fiables; snapshots, importaciones y datos borrables no permiten reconstruir cohortes históricas exactas. No medir lectura anónima a partir de acciones de cuentas. Antes de instrumentar, comprobar qué responde la analítica existente sin añadir rastreo.

## Operación de patrocinio

Entrar en Administración → Patrocinio. Solo ADMIN no suspendido incluido en ADMIN_EMAILS puede leer/escribir; la lista no se entrega al navegador. Completar presentación, destino y medios; guardar y revisar preview. Publicar copia el borrador a un snapshot público. Ediciones posteriores no lo cambian hasta volver a publicar. Ocultar retira acceso público y expira las cachés. Una pestaña con una versión anterior recibe conflicto y permite recargar. La preview nunca ejecuta enlaces de pago, incluso con medios reales.

Los medios desactivados y los campos de transferencia que no pertenecen a un medio de enlace no se incluyen en el snapshot publicado. No se registran ingresos ni se crean notificaciones. La caché pública se invalida solo al publicar/ocultar; el cambio global de navegación requiere invalidación del layout, sin polling. La nueva migración es aditiva y debe aplicarse antes del despliegue; el rollback de aplicación puede conservar la tabla.
