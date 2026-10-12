# Fuentes de la guía de plataformas

Revisión editorial: 2026-10-12. Datos en `src/data/streaming-platforms.ts`.
Esta guía no es una cotización ni un sistema de precios en tiempo real.

| Plataforma      | Fuente oficial                                    | Resultado observado en web                                                                                                           |
| --------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| GagaOOLala      | https://www.gagaoolala.com/en/plans               | USD 4,99 / 1 mes; 13,99 / 3; 23,99 / 6; 43,99 / 12. Tarjeta de crédito/débito. País no indicado junto a la oferta.                   |
| Viki            | https://www.viki.com/pass                         | Standard USD 4,99 mensual / 49,99 anual; Plus USD 9,99 mensual / 99,99 anual. Impuestos aparte. País no confirmado.                  |
| Netflix         | https://help.netflix.com/es/node/24926            | Selector Argentina: Básico ARS 8.999; Estándar 14.999; Premium 19.999 por mes. Pueden sumarse impuestos.                             |
| iQIYI           | https://www.iq.com/                               | No se confirmó precio regional.                                                                                                      |
| WeTV            | https://wetv.vip/                                 | No se confirmó precio regional.                                                                                                      |
| YouTube         | https://support.google.com/youtube/answer/6304294 | Membresías por canal; precio depende de país y canal de compra. Sin tarifa universal.                                                |
| Heavenly        | https://heavenly.tv/                              | Membresías y compras individuales. No se confirmó precio comparable para Argentina.                                                  |
| Bilibili TV     | https://www.bilibili.tv/                          | Oferta regional; no se confirmó precio comparable.                                                                                   |
| Vimeo On Demand | https://vimeo.com/ondemand/faq/viewers            | Cierre el 20/11/2026. Compras hasta el cierre; alquileres hasta cierre o vencimiento anterior. Descargas solo si el creador permite. |

GagaOOLala y Viki se revisaron renderizados en navegador; los resultados de búsqueda y el HTML sin JavaScript mostraban cifras distintas o incompletas. Netflix devolvió euros en un extractor: solo se registró la vista que identificaba explícitamente Argentina. No inferir país por la moneda ni por la ubicación del lector. No hubo compras ni altas de servicios.

## Cómo actualizar

1. Abrir la fuente oficial y revisar país, moneda, canal, duración y condiciones. No usar fragmentos de buscadores como prueba del precio vigente.
2. Registrar importe total del período, no un promedio mensual que oculte el pago anual. No convertir USD a ARS sin fecha, tipo de cambio y tratamiento impositivo explícitos.
3. Actualizar `reviewedOn` solo para las fuentes efectivamente revisadas. Si no se puede confirmar el precio, usar `consult`; no conservar un importe como vigente ni inventar una estimación.
4. Mantener `country: null` cuando la propia fuente no identifique el país. El estado `observed` significa observado en esa consulta, no válido universalmente.
5. Revisar términos y disponibilidad del título antes de recomendar una contratación. No prometer universalmente subtítulos, versiones, resolución ni acceso sin restricciones regionales.
6. Ejecutar `node scripts/test-platform-guide.mjs`, lint y type-check antes de integrar.

## Independencia y acuerdos

Los enlaces publicados son enlaces oficiales ordinarios. No hay un acuerdo de afiliación confirmado en esta implementación: no se atribuyen comisiones ni se agregan etiquetas de afiliado. Cualquier acuerdo futuro requiere condiciones documentadas y divulgación visible; no debe alterar la precedencia del catálogo curado ni garantizar exposición editorial.

Próximo insumo comercial: audiencia real, clics salientes agregados, propuesta concreta y condiciones de atribución/pago. Los precios al consumidor no determinan la comisión de un partnership. Este cambio no incorpora seguimiento adicional, suscripciones ni costos externos.
