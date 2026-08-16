# Ideas de UX y comunidad — MundoBL / nueva plataforma

> Documento de trabajo: brainstorm consolidado (no priorizado, no comprometido a roadmap). Pensado como prompt de referencia para retomar y planificar en detalle cualquier ítem puntual más adelante. Aplica tanto a MundoBL tal cual existe hoy como a una eventual plataforma multi-género/multi-comunidad construida sobre los mismos patrones.
>
> Formato de cada ítem: **qué es** — por qué mejora la experiencia y qué patrón/modelo ya existente en el código reusa (cuando aplica), para que cualquier implementación futura arranque coherente con lo que ya hay en vez de reinventar.

---

## 1. Comunidad y recomendación

- **Seguir a un actor/director, no solo a una serie** — `SeriesSubscription` ya es "avisame cuando cambie esta serie". El mismo patrón en `Actor`/`Director` ("avisame cuando tenga proyecto nuevo") pega fuerte en este fandom — la cultura de "stan" por actor es tan fuerte como por serie — y reusa el patrón de suscripción + notificación ya construido.
- **Botón "Recomiendo esto"** separado de escribir una reseña completa — hoy lo más cercano es `Review.verdict` (RECOMMENDED/MIXED/SKIP), pero exige título+cuerpo. Reusa el mismo patrón `@@unique([userId, targetId])` que ya usan Favoritos/Suscripciones/Votos de review.
- **"Recomendar" como primitivo genérico**, no feature especial — diseñarlo pensado para reusarse en cualquier entidad futura (serie, actor, colección) sin tabla nueva cada vez.
- **Mostrar conteo público de favoritos** ("324 lo tienen en favoritos") — `UserFavorite` ya existe, hoy es 100% privado. Solo falta agregarlo y exponerlo.
- **Reportes parejos en todo tipo de contenido**, no solo comentarios — hoy `CommentReport` es el único mecanismo de reporte. Reviews y cualquier acción de "recomendar" también lo van a necesitar. Conviene un modelo de report reusable (polimórfico) en vez de duplicar una tabla por entidad nueva.
- **Escalera de confianza hacia moderador** — `Role` ya tiene ADMIN/MODERATOR/VISITOR. Una señal simple no-gamificada (actividad + reviews con votos "útil" + cero reportes) ayuda a identificar a quién invitar como moderador a medida que crece la comunidad.
- **Sugerencias/ediciones comunitarias en Actor/Director**, no solo en Series — mismo flujo que `SeriesSuggestion` (propuesta → moderación → aplicar), generalizado (`SuggestedEdit` polimórfico en vez de una tabla por entidad).
- **Reacciones rápidas tipo emoji en comentarios** (❤️ 😭 🔥) además del reporte — engagement liviano, no manipulable como un "like" viral, fácil de sumar sobre el modelo `Comment` existente.
- **Menciones (@usuario) en comentarios/reseñas** para responder directo a alguien, con notificación — reusa el sistema de `Notification` ya existente.
- **"Watch buddies"** — sugerir otros usuarios con gustos similares (mismos tags/géneros bien calificados) sin necesitar un perfil público completo, solo un match simple por afinidad de datos.
- **Perfiles públicos + seguir usuarios** — hoy la comunidad vive pegada al contenido (comentarios/reseñas de una serie), no hay grafo social entre personas. `/perfil` es privado (`noindex`). Es el cambio de mayor impacto para que "comunidad" deje de ser "comentarios sueltos" y pase a ser gente.
- **Colecciones/listas curadas por usuario** (tipo Letterboxd — "mis favoritas para llorar") — ya estaba anotado como diferido en el propio backlog (`UserList/Collection → roadmap`).
- **"Padrinazgo" de contenido** — usuarios de confianza (post escalera de moderación) pueden proponer series completas para importar, no solo watch-links sueltos, reduciendo la carga del curador a solo aprobar en vez de crear desde cero.

## 2. Confianza y transparencia ("estadísticas reales")

- **Página de metodología en `/estadisticas`** explicando cómo se calcula cada número y por qué no hay algoritmo de relevancia detrás — vende el diferencial que ya existe en producción pero nadie explica.
- **Comparación oficial vs. comunidad, explícita** — `Rating` (oficial/admin) y `UserRating` (comunidad) ya son independientes. Mostrarlas lado a lado de forma prominente ("la crítica dice 8, la comunidad real dice 6.2 con 340 votos") vende visceralmente "esto no está manipulado".
- **"Quién está viendo esto ahora"** — `ViewStatus` ya trackea estado VIENDO por serie. Un conteo agregado y anónimo en la ficha es prueba social real sin exponer identidades.
- **Warnings de contenido curados por consenso** — ya había un ítem de backlog sobre "tags sensibles" reformulado como policy doc pendiente. Encaja con "info real, no escondida por un algoritmo": advertencias visibles, decididas por moderación/comunidad.
- **Historial de ediciones de una ficha** (quién/qué se corrigió y cuándo, visible públicamente) — refuerza que los datos no se manipulan en secreto. Mismo espíritu que `ChangelogItem`, aplicado a `Series`.
- **Insignia "dato verificado"** en fichas con alta completitud y sin disputas — refuerza confianza dato por dato, no solo en el agregado.
- **Log de moderación transparente y agregado** ("este mes se ocultaron N reseñas por violar norma X") — no por persona, pero deja ver que moderar no es arbitrario ni oculto.
- **API pública de solo lectura (rate-limited)** — coherente con "datos reales, no manipulados": deja que la propia comunidad audite o construya cosas encima (bots, extensiones, visualizaciones). Señal de confianza fuerte y poco común en sitios de este tipo.

## 3. Descubrimiento y personalización

- **Hub por género** (`/generos/[genero]`) — le da identidad propia a cada género/tribu (hero, destacados, stats filtradas) sin necesitar arquitectura multi-tenant cara. Reusa el modelo `Genre` tal como está.
- **Descubrimiento cruzado por tags/tropes compartidos** — `Tag.category` ya distingue "trope"/"mood". Permite sugerir series de otro género que comparten tropes, sin motor de recomendación con ML.
- **Búsqueda semántica en lenguaje natural** ("quiero algo con final feliz, pocos episodios, no muy dramático") interpretada por IA a filtros estructurados — reusa el mismo helper de Gemini ya usado en otras partes del proyecto.
- **"Sorpréndeme"** — pick semi-aleatorio pesado por los géneros/tags mejor calificados del usuario. Sin ML, solo query sobre datos que ya existen.
- **Filtros guardados** — combinación de género/país/plataforma/año como preset personal reusable. El estado de filtro ya existe en cliente, solo falta persistirlo por usuario.
- **Filtro por duración total** (maratoneable en un finde vs. serie larga) — dato derivable de episodios × duración, ya está en el modelo (`Episode.duration`).
- **"Casi termino de ver"** — usando `ViewStatus` + cantidad de episodios, mostrar series donde el usuario está a 1-2 episodios de terminar, empuja a cerrar el loop de forma honesta (no manipuladora).
- **Onboarding por gustos** — quiz corto al primer login ("elegí géneros/tropes que te gustan") para personalizar el catálogo por defecto. Reusa `Genre`/`Tag`, solo necesita una tabla chica de preferencias.
- **Modo "sin spoilers"** — ocultar comentarios/reseñas marcadas con `hasSpoilers` hasta que el usuario marcó la serie como vista. El campo ya existe en `Review`; falta la lógica condicional y extenderlo a `Comment`.

## 4. Notificaciones y re-engagement honesto

- **"Tu año en MundoBL"** (resumen anual estilo Wrapped) — `CompletedByYear`, `TopGenresList`, `Heatmap`, `TopActors` ya son widgets del dashboard privado de `/perfil`. Armar una vista resumen combinándolos (compartible, opcional) es prácticamente 100% reuso de datos que ya se calculan.
- **Digest semanal/mensual opt-in** ("esta semana: 3 series nuevas en tu género favorito, 12 comentarios nuevos en series que seguís") — reusa `SeriesSubscription` + preferencias de notificación ya existentes.
- **Notificación de serie en pausa** (estado VIENDO sin actividad hace N semanas) — reengagement basado en datos reales del propio usuario, no en manipulación.
- **Completar ficha como loop de crecimiento** — `computeCompleteness()` ya existe puertas adentro (admin). Mostrarle también al usuario común "esta ficha está X% completa" con link directo a `SeriesSuggestion` conecta dos sistemas que hoy no se hablan entre sí.

## 5. Contenido rico y curaduría

- **Reusar Gemini para curar géneros nuevos más rápido** — mismo patrón que ya autopobla metadata en `/ver/agregar` (`user-embed-preview.ts`), aplicado a acelerar carga de contenido en géneros nuevos sin escalar el equipo de curaduría.
- **Línea de tiempo de eventos del fandom por serie** (estreno, finale, premios) — reusa `SeriesInfoBlock` existente, solo cambia la presentación (timeline en vez de card suelta).
- **Distinguir primera vista vs. rewatch** en `ViewStatus` — separa estadísticas de primera vez vs. re-vistas; "series más re-vistas" es una métrica de calidad real, más fuerte que un rating simple.
- **Subtítulos/transcripciones comunitarias** para clips embebidos sin subtítulos oficiales — encaja con contenido ya embebido (YouTube/Vimeo/etc.), valor real para un fandom que ya traduce activamente contenido oficial.
- **Traducción de comentarios/reseñas bajo demanda** — BL/GL es un fandom naturalmente multi-país (fans tailandeses, coreanos, chinos, filipinos, hispanohablantes conviviendo). Un botón "traducir" por comentario (Gemini bajo demanda, no pre-traducir todo, controla costo) deja que un comentario en coreano lo lea alguien de habla hispana.
- **Extensión de navegador / bookmarklet** ("agregá esto a MundoBL") para capturar rápido un link de streaming hacia una ficha existente — reduce fricción para aportar `WatchLink`s.

## 6. Accesibilidad e internacionalización

- **Auditoría automática de a11y** (axe-core / Lighthouse) sobre páginas principales antes de adivinar qué arreglar — ya existe una base fuerte poco común (settings con `data-font="dyslexic"`, `data-tone="contrast"`, `data-scale`, `data-density"`), pero faltaría confirmar foco visible en componentes custom, `alt`/ARIA en botones solo-ícono, contraste WCAG en las combinaciones de accent × skin × tema, y soporte de `prefers-reduced-motion`.
- **URLs con prefijo de locale** (`/en/catalogo`) — hoy el idioma vive en `localStorage` y la URL no cambia, lo que le pone techo al SEO real (sin `hreflang` por URL, sin indexación por idioma) pese a la inversión ya hecha en JSON-LD/sitemap. Next.js App Router lo soporta nativo vía segmento `[locale]`.
- **Traducir contenido, no solo UI** — sinopsis/reseñas viven en un solo idioma hoy. Ya estaba anotado en `context.md` como caso de uso futuro de Gemini ("traducción de sinopsis al importar series"); extenderlo a las otras 9 direcciones sería consistente con lo ya planeado.
- **Marcar jerga de fandom como "no traducible"** (enemies to lovers, ship, OTP) antes de que el pipeline de Gemini la traduzca sin criterio en los 8 locales auto-generados.
- **Confirmar reglas de pluralización** en el helper `t(key)` — "1 comentario" vs "3 comentarios" funciona distinto en coreano/japonés/chino que no pluralizan como el español; punto clásico donde el i18n "completo" en apariencia falla en producción.
- **Modo de datos reducidos más agresivo** — ya existe parcial (data-saver oculta el backdrop del hero); podría extenderse a lazy-load de imágenes/thumbnails, relevante porque buena parte de la audiencia BL/GL está en mercados con conexión más cara/lenta (sudeste asiático, LATAM).

## 7. Ideas más ambiciosas ("someday", no roadmap cercano)

- **Watch parties** — comentarios sincronizados por timestamp de episodio mientras varios lo ven juntos. Encaja con cómo esta comunidad ya consume contenido (reacciones en tiempo real), pero requiere infraestructura nueva (WebSockets) que hoy no existe en el proyecto.
- **Achievements genuinos** (reconocimiento real por completitud/calidad de aportes, no por tiempo en pantalla ni métricas de vanidad) — ya estaba anotado como diferido en el backlog propio.
- **Arquitectura multi-vertical real** (config o dominio por sitio/tribu) — hoy no hay ningún andamiaje (sin middleware, sin site-config, sin ruteo por dominio). Solo tiene sentido si el objetivo pasa a ser varias marcas/comunidades con identidad propia conviviendo en la plataforma.
- **Tribus urbanas no-audiovisuales** (moda, música, gaming como cultura) — el modelo de datos es Serie → Temporada → Episodio; esto no es una extensión de ese schema, sería un producto hermano que reusa el mismo design system/i18n/patrones de comunidad.

---

*Nota: varios ítems de las secciones 1 y 7 (Achievements, Colecciones/UserList, policy de tags sensibles) ya habían sido identificados y deliberadamente diferidos en el backlog existente del proyecto — no son ideas sueltas nuevas, convergen con decisiones de producto que ya se habían tomado.*

---

## Priorización para el arranque (proyecto nuevo, separado de MundoBL)

Curado de todo lo de arriba, pensado para un proyecto de código nuevo (reusa los patrones de MundoBL, no su base de código/recursos):

**Fundamentos — construir bien desde el día 1 (caro de retrofitear después):**
1. `siteConfig` centralizado (nombre, copy, SEO, JSON-LD en un solo lugar) — evita repetir el error de MundoBL de tener la marca desperdigada en ~6 archivos.
2. Género/tag libres desde el modelo de datos, disciplina de nunca hardcodear un rubro en copy ni componentes — MundoBL ya validó el patrón, acá se aplica desde el arranque.
3. Primitivo de voto/endorsement genérico (`@@unique([userId, targetId, kind])` o similar) como base de recomendar/favoritos/reportes — una sola pieza reusable en vez de una tabla por feature.
4. Reporte genérico (polimórfico) para cualquier contenido generado por usuario — así "recomendación abierta + moderación" nace protegida, no parchada después.
5. Roles con escalera de confianza desde el schema (no solo ADMIN/MODERATOR/VISITOR planos) — sostiene el modelo "modero solo al principio, comunidad ayuda después".
6. Estadísticas públicas simples (COUNT/GROUP BY, sin caja negra) desde el día 1 — es la promesa central del producto, barato de hacer bien desde el principio.

**Diferenciadores tempranos (después del esqueleto, pero pronto):**
- Hub por género/tribu (identidad propia sin multi-tenant caro)
- Perfiles públicos + seguir gente
- Traducción de comentarios bajo demanda (si va a ser multi-país desde el arranque)

**Más adelante (no bloquean nada):**
- Achievements, colecciones curadas, watch parties, API pública, onboarding por gustos, y el resto de las secciones 3-7 de arriba.

## Nombre del proyecto — candidatos

| Nombre | Por qué |
|---|---|
| **Tribu** (mi favorito) | Es literalmente el concepto que disparó la idea. Fácil de decir/recordar en cualquier idioma. Deja espacio para nombrar cada comunidad ("Tribu BL", "Tribu K-pop") coherente con el hub por género. |
| Afín / Afines | De "gente afín" — comparte gustos. Corto, no se compromete a un rubro. |
| Nicho | Describe el modelo literalmente (comunidades de nicho, no mainstream). Simple, quizás plano. |
| Veraz | Pone el foco en "estadística real, no manipulada" como identidad de marca. Fuerte pero menos cálido. |
| Culto | Evoca devoción de fandom ("serie de culto"), corto, doble sentido. |

## Infra / capa gratuita (recursos separados de MundoBL)

Mismo stack que ya usa MundoBL, todo con capa gratuita razonable para etapa sandbox:
- **Vercel Hobby** — gratis, alcanza para tráfico bajo.
- **Supabase free tier** — DB + auth + storage gratis; en el plan free el proyecto se pausa tras ~1 semana de inactividad (a tener en cuenta en un "patio de juegos" con tráfico intermitente).
- **Google OAuth** — gratis; solo hace falta un proyecto nuevo en Google Cloud Console con su propio client id/secret (no reusar el de MundoBL).
- **Gemini free tier** — mismo límite que ya usa MundoBL (15 RPM / 1500 RPD), de sobra para esta etapa.

Cuando el user/recursos nuevos estén listos, ayuda para dejar `.env`/config apuntando a lo nuevo sin tocar nada de MundoBL.
