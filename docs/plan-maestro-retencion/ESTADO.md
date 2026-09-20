# Estado de las tareas

Estados posibles: `pendiente` · `en curso` · `en PR` · `hecha` · `bloqueada` · `descartada`.
El agente que toma una tarea la pasa a `en curso` al crear la rama y a `hecha` al mergear. Una línea por tarea, sin borrar historia: si se descarta, poner el motivo.

| ID   | Tarea                                            | Fase | Estado    | Rama / PR | Fecha      | Notas |
| ---- | ------------------------------------------------ | ---- | --------- | --------- | ---------- | ----- |
| T01  | Eventos de embudo en analytics                   | 0    | hecha     | feat/T01-eventos-embudo (PR #33) | 2026-09-20 | Define el contrato que usan T07, T09 y T11b |
| T02  | Widget de retención en /admin/stats              | 0    | pendiente |           |            |       |
| T03  | Marcar episodio promueve la serie a VIENDO       | 1    | hecha     | feat/T03-episodio-promueve-serie (PR #32) | 2026-09-20 | Destrabó T05, T08, T15. Backfill `--apply` corrido en prod: 12 pares corregidos, re-check en 0 |
| T04  | refetch() en SeriesUserStatusProvider            | 1    | pendiente |           |            |       |
| T05  | Endpoint "hasta el episodio N"                   | 1    | pendiente |           |            |       |
| T06  | Stepper "Voy por el episodio N" en la ficha      | 1    | pendiente |           |            |       |
| T07  | CTA para anónimos + intención pendiente          | 1    | pendiente |           |            |       |
| T08  | Botón "+1" claro en /watching                    | 1    | pendiente |           |            |       |
| T09  | Home centrada en el tracker                      | 1    | pendiente |           |            |       |
| T10  | Home logueado → /watching                        | 1    | pendiente |           |            |       |
| T11a | Onboarding: backend                              | 1    | pendiente |           |            |       |
| T11b | Onboarding: UI de 3 pasos                        | 1    | pendiente |           |            |       |
| T12  | Separar acciones admin en EpisodesList           | 1    | pendiente |           |            |       |
| T13  | Tracking como invitado (localStorage)            | 1    | pendiente |           |            | Última de la fase; la más grande |
| T14  | Preferencia de digest semanal                    | 2    | pendiente |           |            | Decisión opt-out/opt-in: ver README |
| T15  | Cálculo del digest (lib pura)                    | 2    | pendiente |           |            |       |
| T16  | Email + cron del digest                          | 2    | pendiente |           |            | Necesita RESEND_API_KEY y CRON_SECRET en Vercel |
| T17  | Nudges "casi terminás" / "en pausa"              | 2    | pendiente |           |            |       |
| T18  | Pedir push/PWA tras el primer episodio           | 2    | pendiente |           |            |       |
| T19  | Reactivación única por email (script)            | 2    | pendiente |           |            | Envío real solo lo dispara Juan |
| T20  | Reacciones por episodio                          | 3    | pendiente |           |            | No arrancar antes de W1 > 25 % |
| T21  | Comentarios de episodio por progreso             | 3    | pendiente |           |            |       |
| T22  | Tarjeta compartible                              | 3    | pendiente |           |            |       |
| T23  | Perfil público opt-in                            | 3    | pendiente |           |            |       |
| T24  | Página "Cómo se sostiene MundoBL"                | 4    | pendiente |           |            |       |
| T25  | Invitar colaboradores entre trackers activos     | 4    | pendiente |           |            | Manual, no es código |
