# Ampliación de /ver — 25/10/2026

Lote `scripts/data/ver-content-2026-10-25.json`: **14 títulos, 125 capítulos, 125 videos**, un video por capítulo y sin partes. Once fichas existentes reciben sus capítulos y tres son altas `WATCHABLE_ONLY`. Son las primeras series de Filipinas, Japón y China en `/ver`; Taiwán pasa de 2 a 4 títulos.

| Ficha                                                   | País | Capítulos | Canal                                                                                               |
| ------------------------------------------------------- | ---- | --------: | --------------------------------------------------------------------------------------------------- |
| 247 — Hello stranger                                    | PH   |         8 | [Black Sheep](https://www.youtube.com/playlist?list=PLbzwe1iIa9XY)                                  |
| 376 — Like in the movies                                | PH   |         8 | [ANIMA Studios](https://www.youtube.com/playlist?list=PLMPz9QG8YAxJXvznmCorwY7N5ausnteMN)           |
| Nueva — Marahuyo Project (2024)                         | PH   |         8 | [ANIMA Studios](https://www.youtube.com/playlist?list=PLMPz9QG8YAxIjGoPfHFugXYAbumaqC0Cj)           |
| 293 — My brother in law is my favorite novelist!?       | JP   |         4 | [nooto.](https://www.youtube.com/playlist?list=PLmz1FNoG1zYHVHiX7zTnjlixJi5YmDE4R)                  |
| 341 — My teacher spoils me - Lemon candy, love’s flavor | JP   |         2 | [nooto.](https://www.youtube.com/playlist?list=PLmz1FNoG1zYFTUtbc-L4AOhmudPjnYa-b)                  |
| 25 — Active boys                                        | VN   |        12 | [O2 Production](https://www.youtube.com/playlist?list=PLf_mCRbXsMcDAps5Bg4MT78oGQVW23JVj)           |
| 194 — Fight for love                                    | VN   |         7 | [RL Studio](https://www.youtube.com/playlist?list=PL8vHP9TU8ecUXxx_O2-YW-_7kvJjtr4bx)               |
| 188 — Stupid boys, stupid love                          | VN   |         4 | [RL Studio](https://www.youtube.com/playlist?list=PL8vHP9TU8ecVk0I4KTWuV1PF73uYTWlC1)               |
| 653 — My sweet brother in law                           | VN   |         5 | [MOI Studio](https://www.youtube.com/playlist?list=PLW77Fj3pF6azYFNYpQv8Q-L2m5yOjWW0l)              |
| 269 — Hot brother next door                             | VN   |        10 | [MOI Studio](https://www.youtube.com/playlist?list=PLW77Fj3pF6axAbuORoLZSEPE0ljnT0BrN)              |
| 232 — Happiness Flies Away                              | VN   |         8 | [Vũ Luân Entertainment](https://www.youtube.com/playlist?list=PLfnQxeTD8yucdxgmcH6W8XIG4mPhAhPw2)   |
| 330 — Kiseki: Dear to me                                | TW   |        13 | [GTV Drama](https://www.youtube.com/playlist?list=PLk2gvyPpHLRe8inr346RI_w_3fskmlW83)               |
| Nueva — Unknown (2024)                                  | TW   |        12 | [YOUKU English](https://www.youtube.com/playlist?list=PLIPiKkS-FpK8QOw3QjsxMNGBG0qev28Q5)           |
| Nueva — Stay With Me (2023)                             | CN   |        24 | [Huace Croton TV English](https://www.youtube.com/playlist?list=PLiL-CuIBxVwOwR2UR1BLsJZdkQgTgysS1) |

Las once fichas tenían la temporada 1 con exactamente esos capítulos, sin embeds, duración ni título. No se pisa nada: el importador completa los campos vacíos, registra `SeriesRevision` e incrementa `editVersion`. Kiseki usa las subidas estándar; las «LIVE ver.» del mismo canal son solo para miembros. Marahuyo EP7–8 están en el canal de ANIMA pero fuera de su playlist.

## Canales nuevos

Nueve en `src/lib/official-channels.ts`. Handle e ID contrastados con `channels.list?forHandle` el 25/10; identidad según la descripción del canal y, cuando hizo falta, fuentes externas.

- **Black Sheep** `UCtI55bOVfu43CatriKvqF_w`: marca de ABS-CBN Films.
- **ANIMA Studios** `UCtoEQCndXx-v7FemDigT17g`: estudio de Manila.
- **Oxin Films** `UC3mvG0KIKHT7MsaWMjB3dDw`: productora filipina de series LGBTQ+. Sin títulos en este lote (ver exclusiones); estar en la lista no vuelve gratuitos sus videos.
- **RL Studio** `UC0WWgNgyUc5Y85_DesZXTYw`: canal oficial de RL Team.
- **MOI Studio** `UCiZQMLN9MRhE0MYqHJFVwXA`: productora de series BL.
- **Vũ Luân Entertainment** `UCENtpQFw4dhnGn3TFVzJauA`: productora de Happiness Flies Away ([BL Dramas](https://bldramas.com/vietnamese-bl/), [Boys Love France](https://boyslovefrance.wordpress.com/2021/01/10/fiche-drama-happiness-flies-away-eng-sub/)).
- **GTV Drama** `UCZ2EoLNz4EzAnAIKCGhiRzQ`: canal de dramas de Gala Television; declara contenido con licencia.
- **YOUKU English** `UCI70JGG0hJS306Q-hGWfB7Q`: canal internacional de Youku. Unknown es taiwanesa ([Wikipedia](<https://en.wikipedia.org/wiki/Unknown_(TV_series)>)).
- **Huace Croton TV English** `UCcLEMsxL1UYqz_CI8Y6Wrvg`: canal internacional de Huace. Stay With Me es de 2023 aunque la subida sea de 2025 ([Wikipedia](<https://en.wikipedia.org/wiki/Stay_with_Me_(2023_TV_series)>)).

Black Sheep, ANIMA, Vũ Luân, GTV, YOUKU y Huace publican sobre todo catálogo general: quedan fuera de las noticias automáticas (`EXCLUDED_CHANNELS` en `news-ingest.ts`), igual que WeTV Thailand.

## Verificación

- Data API, por video: canal real igual al del manifiesto, ≥300 s, público, embebible, sin age-gate, sin bloqueo en AR/MX/ES/CL/CO/PE/US y presente en la playlist oficial. El manifiesto se generó con esas mismas condiciones.
- Página anónima desde AR, 03:15 UTC: de 157 candidatos, 19 pedían membresía aunque la API los daba públicos. Se excluyeron. Los 125 restantes, `playabilityStatus=OK`.
- Al repetir para aplicar en local, YouTube respondió 429 en las tres primeras páginas y el importador se detuvo sin escribir. El ensayo local se completó con la evidencia de 03:15 (menos de una hora, todo OK) y la API consultada de nuevo, con un script fuera de Git. La publicación sigue exigiendo evidencia nueva y completa de los 125.
- Ensayo en `mundobl_ver_expansion` (metadata pública de producción, 788 fichas): 788 → 791 fichas, 8.830 → 8.874 capítulos, `/ver` 43 → 57. Repetir el lote es un no-op.
- No certifica subtítulos en español ni ver completos los videos. La disponibilidad puede cambiar.

## Excluidos

Casi todo lo de esta lista entró en el [segundo lote](#segundo-lote-2026-10-25-b): las exclusiones por formato, inserción, edad, género o datos dudosos eran criterios nuestros, no límites del contenido.

- **Rainbow Prince** y **My Story** (Oxin): las versiones completas de EP2–10 son solo para miembros. Las subidas en cuatro partes no se comprobaron para no sumar 80 páginas más.
- **Jake & Vince** (Windsor): EP10 es solo para miembros.
- **Sugar Games**, **Sky Valley**, **Hermoso**, **Sereno**, **My Day**, **The Boyfriend Express** (Oxin): capítulos o partes con restricción de edad. Sugar Games además tiene 6 de 8. **Our Story**: una parte con restricción; no se usó otra subida del mismo capítulo para esquivarla.
- **He's Mine** (RAP Production): EP7 y EP10 no permiten inserción.
- **Boys' Lockdown** (Ticket2Me): 12 partes sobre una ficha que ya tiene 6 capítulos; el importador no renumera.
- **Craving You** (AcroGrowth): EP1 y EP2 en un solo video.
- **Gameboys** (IdeaFirst): el canal ya no tiene los capítulos.
- **VBL Series** (TW): EP1–3 de cada serie reciente bloqueados en los siete mercados; las anteriores, completas bloqueadas.
- **監禁犯は、私の最愛の人でした** (nooto): al aire, 6 de 10.
- Otros nooto completos sin ficha: faltaría un título oficial en castellano o inglés. **Pearl Next Door** y **その瞬間、恋だった**: GL. **The Sexth Sense**: programa de charla.
- **The Director Who Buys Me Dinner** (iQIYI Philippines): país, año y doblaje sin confirmar.
- **Sashes and Hearts** (Oxin): limpio en la API, 52 partes; páginas sin comprobar.
- **Lovememory** `UCkRJH5bxKnuceyYwDLBXxCgw`, ya en la lista: la API responde «Channel not found». No se quitó.

## Código

- `scripts/data/ver-content-batch.ts` registra cada lote con su cantidad exacta de videos. `--batch=` es obligatorio en el ensayo y en el ejecutor: cada entrega verifica y aplica solo su lote, y la evidencia debe cubrir exactamente esos videos. El lote 2026-10-24 conserva su id y sus 115 videos.
- `test-watch-content-batch.ts` comprueba conteos, duplicados, canales oficiales y el argumento.
- Sin migración de schema ni cadenas nuevas de interfaz.

## Publicar

```powershell
# 1. Ensayo local: vuelve a verificar API + páginas y escribe la evidencia
$env:DATABASE_URL='postgresql://mundobl:mundobl@127.0.0.1:55433/mundobl_ver_expansion'
npx tsx scripts/import-ver-content-batch.ts --batch=2026-10-25
# 2. Producción, con esa evidencia (menos de una hora)
node --env-file=.env --import tsx scripts/publish-ver-content-batch.ts --batch=2026-10-25 --evidence=test-results/ver-expansion/playback-FECHA.json
node --env-file=.env --import tsx scripts/publish-ver-content-batch.ts --batch=2026-10-25 --evidence=test-results/ver-expansion/playback-FECHA.json --plan=backups/ver-release-FECHA/plan.json --apply
```

La lista de canales solo se consulta al escribir episodios: `/ver` y las fichas muestran los datos aplicados aunque el código no esté desplegado. `/ver` se regenera cada 6 h; una ficha `/ver/[id]` ya cacheada puede tardar hasta 7 días o hasta el próximo deploy.

## Segundo lote (2026-10-25-b)

Criterio: no se descarta contenido oficial por formato, inserción, restricción de edad, género, estado de emisión ni datos dudosos. Se incluye y se avisa. Quedan afuera solo los videos para miembros, los ocultos (no listados) por el canal y lo no oficial.

Lote `scripts/data/ver-content-2026-10-25-b.json`: **24 títulos, 188 capítulos, 455 videos**. Cinco fichas existentes y 19 altas `WATCHABLE_ONLY`.

| Ficha                                                                  | País | Capítulos (videos) | Canal                 | Nota                                                                                                                               |
| ---------------------------------------------------------------------- | ---- | -----------------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 612 — My day                                                           | PH   |            12 (48) | Oxin Films            | partes sobre la ficha; 2 partes +18                                                                                                |
| 86 — Boys' lockdown                                                    | PH   |             6 (12) | Ticket2Me             | partes sobre la ficha                                                                                                              |
| 241 — He´s mine                                                        | PH   |            10 (10) | RAP Production        | EP7 y EP10 no insertables                                                                                                          |
| 523 — Sugar games                                                      | PH   |         6 de 8 (6) | Oxin Films            | EP2 y EP4 +18; 7–8 sin publicar                                                                                                    |
| Nueva — Sereno (2025)                                                  | PH   |            10 (40) | Oxin Films            | 4 partes +18                                                                                                                       |
| Nueva — Hermoso (2025)                                                 | PH   |            10 (40) | Oxin Films            | 8 partes +18; sin el especial                                                                                                      |
| Nueva — Hermoso 2 (2026)                                               | PH   |            13 (13) | Oxin Films            | EP13 +18; sin las «Director's Cut»                                                                                                 |
| Nueva — The Boyfriend Express (2026)                                   | PH   |            10 (40) | Oxin Films            | 7 partes +18                                                                                                                       |
| Nueva — Our Story (2023)                                               | PH   |            13 (49) | Oxin Films            | EP1 completo (falta su parte 4/4); 1 parte +18                                                                                     |
| Nueva — Rainbow Prince (2022)                                          | PH   |            10 (40) | Oxin Films            | partes; las completas son para miembros                                                                                            |
| Nueva — My Story (2023)                                                | PH   |            10 (40) | Oxin Films            | partes; ídem                                                                                                                       |
| Nueva — Sashes and Hearts (2025)                                       | PH   |            13 (52) | Oxin Films            |                                                                                                                                    |
| Nueva — Jake & Vince (2025)                                            | PH   |        9 de 12 (9) | Windsor Creatives     | EP10 es para miembros; 11–12 esperan                                                                                               |
| Nueva — Haunted Hearts (2024)                                          | PH   |              7 (7) | Regal Entertainment   |                                                                                                                                    |
| Nueva — Pearl Next Door (2020)                                         | PH   |              8 (8) | The IdeaFirst Company | GL                                                                                                                                 |
| Nueva — The Sexth Sense (2021)                                         | PH   |              9 (9) | The IdeaFirst Company | programa de charla                                                                                                                 |
| Nueva — Sky Valley (2026)                                              | PH   |        1 de 13 (1) | Oxin Films            | EP2–13 para miembros; las partes están ocultas                                                                                     |
| Nueva — 夜勤明けのキスは突然に (2026)                                  | JP   |              4 (4) | nooto.                | título original                                                                                                                    |
| Nueva — 俺がコイツに恋するなんて！ 地味経理はときどきホスト！？ (2025) | JP   |              2 (2) | nooto.                | título original                                                                                                                    |
| Nueva — ídem 2 (2026)                                                  | JP   |              4 (4) | nooto.                | título original                                                                                                                    |
| Nueva — ヤンチャ君とボクのクリームソーダな恋 (2025)                    | JP   |              2 (2) | nooto.                | título original                                                                                                                    |
| 670 — The kidnapper was my loved one                                   | JP   |        6 de 10 (6) | nooto.                | al aire                                                                                                                            |
| Nueva — その瞬間、恋だった (2026)                                      | JP   |              3 (3) | nooto.                | GL, al aire                                                                                                                        |
| Nueva — The Director Who Buys Me Dinner (2022)                         | KR   |            10 (10) | iQIYI Philippines     | coreana de KENAZ ([blwatcher](https://blwatcher.com/bl-series/the-director-who-buys-me-dinner-drama-review/)); audio sin verificar |

Para revisar: los cinco títulos japoneses nuevos entran con su título original porque nooto no publica uno en castellano o inglés. Ninguna serie se marcó +18 en MundoBL: la restricción de YouTube no cambia la clasificación propia.

### Cómo se muestra

- **Restricción de edad en YouTube** (25 videos): no se reproduce fuera de YouTube. En `/ver` no se monta el reproductor; con sesión iniciada aparece «Abrir en YouTube», sin sesión un botón para iniciarla. El avance se marca en MundoBL.
- **Sin inserción** (2 videos): «No se puede reproducir acá. Miralo en YouTube y seguí tu avance desde MundoBL», con el link para todos.
- Los capítulos aún no publicados de una serie al aire siguen siendo capítulos (con título numerado), no extras.
- El link se oculta por diseño, no por seguridad: el ID del video sigue en los datos de la página y YouTube aplica su propia verificación de edad.

### Canales nuevos

**Ticket2Me** `UCEUc7aPMQLNvvVqRvW3Pbxg`, **RAP Production** `UCW-3ixU-hvGhSyR_ZPKckCg` y **Regal Entertainment** `UC69I8egELqWywoX5wrh2KxQ` (Haunted Hearts salió por su canal: [MyDramaList](https://mydramalist.com/779406-haunted-hearts/reviews), [bldramas](https://bldramas.com/2024/11/02/haunted-hearts/)). Handle e ID contrastados con la API el 25/10. Ticket2Me y Regal quedan fuera de las noticias automáticas.

### Verificación

- Data API: canal real, ≥300 s, público y presente en la playlist oficial (He's Mine: RAP no tiene playlist; se usa el canal). El estado esperado de cada video (+18, sin inserción) sale de la API y queda declarado en el manifiesto.
- Página anónima de los 491 candidatos, un pedido cada 2 s, sin 429 (05:44–06:04 UTC). Todos coincidieron con lo declarado salvo VBL, que quedó afuera.
- Ensayo local sobre metadata pública de producción (791 fichas): 791 → 810 fichas, 8.874 → 9.289 capítulos, `/ver` 57 → 81. Las fichas con partes conservan los IDs de sus capítulos y lo visto se copia a las partes nuevas. Repetir el lote es un no-op.

### Sigue afuera

- **VBL Series** (The Promise of the Soul, Fight for You, Eternal Butler): EP1–3 bloqueados en los siete mercados y EP4 en adelante para miembros.
- **The Prosecutor's Proposal** (ficha 453): iQIYI solo sube fragmentos de menos de 5 minutos.
- **Craving You** (ficha 140): EP1 y EP2 en un solo video sin marca de dónde empieza el 2 (ni descripción ni capítulos de YouTube). Hace falta ese minuto para partirlo bien.
- Rainbow Prince/My Story completos, Sky Valley EP2–13 y Jake & Vince EP10: solo para miembros.

### Código

- `WatchBatchEpisode.playback` declara `AGE_RESTRICTED`, `NOT_EMBEDDABLE` o `GEO_BLOCKED`; la API y la página anónima tienen que coincidir. Miembros, borrado o privado nunca entran.
- Partes sobre una temporada cargada a mano (capítulos 1..N, sin video ni título): cada fila queda como parte 1 con su ID y su seguimiento; se crean las demás partes y se les copia `ViewStatus`. El progreso anónimo del navegador no se puede migrar: esos visitantes verán el capítulo en la parte 1.
- El ensayo consulta las páginas de a una, cada 2 s; se detiene ante 429.
- `availabilityOf` distingue `age_restricted`. Tres cadenas nuevas y el texto de «sin inserción» en los diez idiomas. `test-ver-availability-app.mjs` lo prueba contra `next start`.
- Sin migración de schema.
