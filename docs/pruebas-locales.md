# Pruebas locales con Docker Compose

```bash
npm run test:docker
```

Ejecuta la suite completa en contenedores locales: Node 22, PostgreSQL 16 y
Chromium. Usa `scripts/test-all.mjs`, la misma lista de verificaciones que el
workflow remoto opcional. No requiere instalar PostgreSQL ni Chromium en Windows.

## Preparar la máquina

1. Instalar Node 22 y Git para ejecutar el comando y los hooks.
2. Tener Docker con el plugin Compose disponible. En Windows se detecta Docker
   Desktop o, si no está en PATH, Docker en la distribución WSL predeterminada.
3. Ejecutar `npm install` para desarrollo. También activa el hook pre-push.
   Si las dependencias ya están instaladas, `node scripts/install-git-hooks.mjs`
   activa el hook sin reinstalarlas.
4. Ejecutar `npm run test:docker`. Para revisar solamente la configuración:
   `npm run test:docker -- --config`.

La primera ejecución descarga imágenes, dependencias npm y Chromium; puede tardar
más que las siguientes. Docker conserva esas capas. Cambiar código reconstruye
la capa de fuentes, sin reinstalar dependencias mientras no cambien el lockfile,
`package.json`, `.npmrc` o las instrucciones anteriores del Dockerfile.

## Aislamiento y recursos

- `compose.test.yml` es independiente del Compose de desarrollo. PostgreSQL usa
  memoria temporal y se descarta al terminar; no hay volúmenes de datos persistentes.
- Los dos contenedores comparten una red interna, sin salida a Internet durante
  las pruebas. No se publica ningún puerto en Windows ni se conecta a Supabase,
  Vercel, YouTube u otros servicios reales. Solo construir la imagen necesita red.
- `.dockerignore` incluye únicamente fuentes y configuración de prueba. No entran
  `.env*`, `.git`, backups, reportes privados ni `node_modules` del equipo.
  Compose usa un archivo de entorno vacío y credenciales ficticias de prueba.
- No se monta el directorio del proyecto dentro del contenedor. El único montaje
  escribe logs en `test-results/compose/`.
- El comando elimina sus contenedores y su red al finalizar, incluso si falla una
  prueba. Las imágenes quedan cacheadas. Una interrupción forzada del proceso o
  un apagado puede impedir la limpieza: comprobar que no sigue una corrida antes
  de quitar `test-results/compose/running.lock` y volver a ejecutar.

El trabajo consume CPU, RAM y disco de esta máquina. No consume las cuotas del
sitio en producción. El tiempo depende del equipo y de si las capas están cacheadas.

## Qué verifica

1. Prisma, TypeScript, ESLint y formato.
2. Migraciones e igualdad entre el historial y el schema.
3. Regresiones de datos y rutas con datos sintéticos.
4. Backup y restauración en otra base descartable.
5. Diez locales y componentes reales en Chromium.
6. Build de producción y pruebas contra `next start` dentro del contenedor.

El restore de las 80 tablas comprueba el mecanismo completo con datos de prueba;
no descarga ni restaura una copia de la base real.

Para iterar rápido: `npm run test:fast`. El modo nativo anterior sigue disponible
con `npm run test:all` y requiere las dependencias del host; no tiene el aislamiento
de red de Compose. Admite `-- --list` y `-- --from=<paso>`. Consultar
[seguimiento-pruebas-locales.md](seguimiento-pruebas-locales.md) para una base local
externa. El comando Compose siempre ejecuta la suite completa.

## Pruebas automáticas antes de publicar

- Push a `main`: el hook ejecuta `test:docker` completo. Exige que HEAD sea el
  commit que se publica y que no haya cambios pendientes en archivos trackeados.
- Push a otra rama: ejecuta `test:fast`.
- El hook debe estar instalado en cada clon. No se ejecuta al usar el botón de
  merge de GitHub ni en un agente remoto que lo omita. Esas entregas necesitan una
  validación explícita de la revisión que se publicará.
- El contexto Docker usa el árbol de trabajo: antes de publicar hay que incluir
  los archivos nuevos necesarios en Git; el hook no detecta los nuevos sin `git add`.
- `git push --no-verify` omite el hook: no usarlo para evitar una prueba fallida.

`tracking.yml` queda con `workflow_dispatch`: una comprobación remota limpia solo
cuando se solicite. Este cambio surte efecto en GitHub al publicar el lote que lo
contiene. No genera previews ni deploys.

## Cuotas de las plataformas

- **Supabase:** las regresiones usan PostgreSQL descartable, tanto localmente como
  en Actions. No gastan recursos de la base de producción.
- **GitHub Actions:** este repositorio es público; los runners estándar no cobran
  minutos. Artifacts y cachés tienen sus propios límites. Se deja el workflow
  manual para evitar trabajo remoto automático que el propietario no desea.
- **Vercel:** `vercel.json` desactiva deploys Git. Solo se publica con el workflow
  manual autorizado; cada deploy y el tráfico real tienen sus propios recursos.
  Mover pruebas a Docker no elimina el consumo de esos despliegues.

Fuente: [facturación de GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
