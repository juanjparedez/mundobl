# T08b — /watching: cards sin episodios y contraste del botón primario (corrección de T08)

**Fase:** 1 · **Esfuerzo:** S · **Depende de:** T08 (mergeada)

## Qué está mal hoy (revisión 2026-09-20)

1. Una serie en VIENDO **sin episodios cargados** (ej. `.avi`, corto) muestra barra "0/0", ningún "Siguiente" y **ningún botón primario** (T08 gatea "Terminé la serie" con `totalEpisodes > 0`). La card queda sin acción posible.
2. El botón primario amarillo (`type="primary"`) muestra el texto en blanco sobre amarillo y casi no se lee ("Continuar viendo" en la captura). Es un problema del tema, no de T08, pero es la acción principal del producto y hay que resolverlo acá.

## Cambios

1. **Cards sin episodios**: ocultar la barra y el "Siguiente"; mostrar el texto `t('watchingDashboard.noEpisodesHint')` "Sin episodios cargados" y como botón primario `t('watchingDashboard.markCompleteLabel')` "Terminé la serie" (sin `Popconfirm` en este caso, porque no hay progreso que perder), que llama a `handleMarkSeriesComplete`. Quitar la condición `totalEpisodes > 0` de esa rama.
2. **Contraste**: en `src/lib/providers/ThemeProvider.tsx`, revisar el token de texto sobre primario (`colorTextLightSolid` o el `primaryColor` del componente `Button` en antd 6) para que sobre `--primary-color` se use un color oscuro (`--text-inverse` o el token que corresponda en `variables.css`, **no** un hex nuevo). Verificar en los tres skins/tonos existentes que el ratio de contraste sea ≥ 4.5:1 (usar el inspector de accesibilidad del navegador). Si el tema ya lo resuelve y la captura correspondía a un accent puntual, documentarlo en el PR y no tocar nada.
3. En la card, el orden vertical debe ser: póster → título/chips → barra + "Siguiente" → **botón primario** → fila secundaria (nota, editar, "Continuar viendo" como `default`). Confirmar que T08 dejó "Continuar viendo" como `type="default"`; si no, corregir.

## i18n

`watchingDashboard.noEpisodesHint`.

## Criterios de aceptación

- [ ] Una serie sin episodios en `/watching` tiene el botón "Terminé la serie" y al tocarlo sale de la lista.
- [ ] El texto de todos los botones primarios se lee con contraste ≥ 4.5:1 en los skins disponibles.
- [ ] "Vi el ep. n" es el único botón primario de cada card con episodios.
- [ ] type-check, lint, build; 10 locales.
