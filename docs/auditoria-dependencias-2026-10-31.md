# Auditoría de dependencias — 2026-10-31

Solicitada por el propietario durante el lote de estadísticas. Actualización de versiones estables dentro de los rangos compatibles, con lockfile reproducible. No se usó `npm audit fix --force`.

## Resultado de npm audit

| Alcance | Antes | Después |
| --- | --- | --- |
| Producción (`npm audit --omit=dev`) | 0 | 0 |
| Árbol completo | 18: 1 alta, 16 moderadas, 1 baja | 14 moderadas; 0 altas/críticas/bajas |

Las cifras son alertas de paquetes, incluidas las propagadas por la misma dependencia, no 14 fallos independientes. Los JSON completos de la ejecución local están en `test-results/dependency-audit-{before,after}.json` y `dependency-audit-prod-{before,after}.json` (artefactos ignorados). Una auditoría sin alertas no garantiza ausencia de vulnerabilidades desconocidas.

## Actualizaciones

- Next 16.4.2 → 16.4.3 y eslint-config-next 16.1.6 → 16.4.3.
- React/React DOM 19.2.4 → 19.3.1; tipos React 19.3.0.
- Ant Design 6.5.1 → 6.6.8, react-grid-layout 2.2.3 → 2.3.0 y Recharts 3.10.0 → 3.10.1. La grilla ahora expone un componente forwardRef sin parámetro genérico: se adapta el callback validando el breakpoint contra la configuración existente.
- Supabase 2.110.8 → 2.118.0, pg 8.22.0 → 8.23.1, editor Markdown 4.1.1 → 4.2.0 y parser XML 5.11.1 → 5.11.2.
- Playwright y su runner alineados en 1.64.1; typescript-eslint 8.72.1; tsx 4.23.15; Wrangler 4.156.0; actualización compatible de herramientas y dependencias transitivas.
- esbuild 0.27.3 → 0.28.2 elimina [GHSA-g7r4-m6w7-qqqr](https://github.com/evanw/esbuild/security/advisories/GHSA-g7r4-m6w7-qqqr).
- undici 7.29.1 → 7.30.1, usado por Miniflare/Wrangler, incorpora las [correcciones del mantenedor](https://github.com/nodejs/undici/releases/tag/v7.30.1).
- `audit:prod` y `audit:dependencies` permiten repetir ambos alcances. Las autorizaciones de scripts existentes se alinean con las versiones instaladas de Prisma/esbuild.

## Hallazgo residual: minimatch

npm reporta [GHSA-g3hv-75wg-m249](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249) para minimatch <11.0.1; el aviso original describe amplificación de patrones con `optimizationLevel >= 2`. El árbol de lint sigue dependiendo de minimatch 3.1.5 y 10.2.6. No se reemplaza globalmente por 11: la interfaz de la versión 3 no es intercambiable y rompería consumidores. Tampoco se aceptan los downgrades de ESLint 4 o eslint-config-next 0.2.4 que propone npm.

Exposición revisada: son herramientas de desarrollo/lint que procesan patrones del repositorio, no entradas de usuarios del sitio. No aparecen en la auditoría de producción. Queda pendiente una actualización compatible de los consumidores; se conserva la alerta visible en `npm run audit:dependencies` (salida no cero). No se silencia el advisory ni se afirma auditoría total en cero.

## Versiones retenidas

- eslint-plugin-react-hooks 7.0.1 (override limitado a eslint-config-next) y Prettier 3.8.1 se mantienen en sus versiones anteriores. La versión 7.1.1 del plugin añadió 62 diagnósticos en código existente (58 set-state-in-effect, 2 refs, 1 immutability y 1 preserve-manual-memoization), también al probar con eslint-config-next anterior. Prettier 3.9 cambió el formato de múltiples archivos ajenos. Se conserva el contrato de validación anterior; no se deshabilitan reglas ni se agregan excepciones en archivos. La migración a las comprobaciones nuevas de React requiere un lote de refactorización específico. Los resultados están en test-results/lint-after-update.json.

- ESLint 9.39.5: eslint-plugin-react 7.37.5 declara compatibilidad hasta ESLint 9.7; ESLint 10 aún usa minimatch 10 y no resuelve por sí solo el hallazgo.
- TypeScript 5.9.3: typescript-eslint 8.72.1 declara `<6.1.0`; no se fuerza TypeScript 7.
- Prisma/client/adapter 7.10.1 sincronizados: Prisma 8.0.0-rc.29 es una release candidate y requiere una migración independiente, no una actualización automática de mantenimiento.
- next-auth 5.0.0-beta.32 conserva el contrato existente; el dist-tag latest de npm apunta a v4 y no debe interpretarse como upgrade.
- No se hacen migraciones mayores de mapas, schema-dts ni dotenv. Se conserva la configuración de resolución de peers existente.

## Validación de entrega

La publicación está condicionada al hook completo `test:docker`: tipos, lint, formato, PostgreSQL real, restauración, UI Chromium, build y pruebas HTTP autenticadas contra Next compilado. Las regresiones de grilla verifican flujo móvil, orden guardado y alturas de escritorio. Las de estadísticas cubren las cuatro páginas públicas/administrativas, ventanas 30/90 días, exclusión de equipo y clics reales del piloto con usuarios sintéticos. No se modifican datos de producción para validar.
