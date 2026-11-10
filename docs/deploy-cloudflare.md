# Deploy en Cloudflare Workers

MundoBL corre en Cloudflare Workers Paid (USD 5 por mes) con
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). La base sigue
en Supabase y las imágenes en R2. Vercel se dejó en noviembre de 2026 porque
el plan gratis se pasaba de cuota (CPU e ISR writes) y amenazaba con pausar la
cuenta.

## Qué incluye el plan de USD 5

- 10 millones de requests y 30 millones de ms de CPU por mes. La espera a la
  base no cuenta como CPU.
- Durable Objects (cola de revalidación y tag cache).
- R2 aparte: 10 GB y 1 millón de escrituras por mes gratis. El cache ISR vive
  en el bucket `mundobl-opennext-cache`, que el primer deploy crea solo.

## Piezas

| Archivo                              | Qué hace                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `wrangler.jsonc`                     | Worker `mundobl`: bindings (R2, Durable Objects, Images), crons, límite de CPU, placement.                                      |
| `open-next.config.ts`                | Cache de Next: ISR en R2, cola y tag cache en Durable Objects.                                                                  |
| `cloudflare/worker.ts`               | Entrada del Worker: el handler de OpenNext más los crons (`/api/cron/daily` y `/api/cron/alerts`).                              |
| `.github/workflows/deploy.yml`       | Botón **Deploy producción**: build, secrets y deploy.                                                                           |
| `scripts/prepare-production-env.mjs` | Junta `MUNDOBL_ENV` y los secrets sueltos del repo, valida lo obligatorio y arma el entorno del build y los secrets del Worker. |
| `scripts/run-with-env.mjs`           | Corre el build con ese entorno.                                                                                                 |

## Configuración inicial (una sola vez)

1. **Workers Paid.** Cloudflare → Workers & Pages → Plans → Workers Paid.
2. **Token.** Cloudflare → My Profile → API Tokens → Create Token → template
   **Edit Cloudflare Workers**. En Account Resources elegir la cuenta y en
   Zone Resources `mundobl.com.ar`. Copiar el token.
3. **Account ID.** Cloudflare → Workers & Pages: está en la columna de la
   derecha ("Account ID").
4. **El `.env` de producción.** En PowerShell, dentro del repo:

   ```powershell
   npx vercel@62.7.0 login
   npx vercel@62.7.0 link
   npx vercel@62.7.0 env pull produccion.env --environment=production
   ```

   Abrir `produccion.env` y:
   - Borrar las líneas que empiezan con `VERCEL_` y
     `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED` (Vercel Analytics no funciona
     fuera de Vercel).
   - Revisar que ninguna quede vacía (`CLAVE=""`). Vercel no devuelve las
     marcadas como _sensitive_: esas hay que completarlas a mano.
   - `AUTH_SECRET` tiene que ser **el mismo**: si cambia, todos quedan
     deslogueados.

5. **Secrets de GitHub.** github.com/juanjparedez/mundobl → Settings →
   Secrets and variables → Actions → New repository secret:
   - `CLOUDFLARE_API_TOKEN`: el token del paso 2.
   - `CLOUDFLARE_ACCOUNT_ID`: el ID del paso 3.
   - Las variables de la app, de cualquiera de estas dos formas (se pueden
     mezclar; si una está en los dos lados, gana el secret suelto):
     - `MUNDOBL_ENV`: el contenido completo de `produccion.env`.
     - Un secret por variable, con el mismo nombre (`DATABASE_URL`,
       `GOOGLE_CLIENT_ID`, `R2_ACCESS_KEY_ID`...).
       El workflow los lee por nombre (lista `APP_KEYS` en
       `scripts/prepare-production-env.mjs` y el `env` del paso "Cargar el
       entorno" en `deploy.yml`). Una variable nueva se agrega en los dos
       lados; si no coinciden, el deploy falla avisando cuál falta.

   Los `[SENSITIVE]` y las líneas `VERCEL_*` se ignoran solas. Si falta algo
   obligatorio, el deploy lo dice antes de buildear. Después borrar
   `produccion.env` de la compu.

## Deploy

Actions → **Deploy producción** → Run workflow (rama `main`). Tarda unos
10 minutos. Si falta un secret o una variable obligatoria, el workflow lo dice
en rojo antes de deployar.

El Worker solo responde en `mundobl.com.ar` (`workers_dev: false` en
`wrangler.jsonc`). Para probar antes de publicar, usar `npm run cf:preview`
en local. El login con Google solo acepta `mundobl.com.ar`.

## Pasar el dominio (una sola vez)

1. Cloudflare → `mundobl.com.ar` → DNS → Records: borrar los registros `A`
   de `mundobl.com.ar` que apuntan a Vercel (`216.198.79.1` y
   `64.29.17.1`). Si hay un `CNAME` de `www` a Vercel, borrarlo también.
2. Workers & Pages → mundobl → Settings → Domains & Routes → Add → Custom
   domain → `mundobl.com.ar`. Repetir con `www.mundobl.com.ar` si se usa.
3. Probar: login con Google, ficha de una serie, subir un póster desde
   /admin, /novedades.
4. Vercel → proyecto → Settings → pausar o borrar el proyecto, para que sus
   crons no sigan corriendo. (Las dos tareas son idempotentes, así que una
   superposición de un día no duplica avisos.)

Entre el paso 1 y el 2 el sitio queda sin responder uno o dos minutos.

**Volver atrás:** borrar el custom domain del Worker y recrear los registros
`A` a Vercel (si el proyecto de Vercel sigue sin borrar).

## Desarrollo local contra workerd

```bash
npx opennextjs-cloudflare build   # con DATABASE_URL/AUTH_SECRET exportadas
npx wrangler dev --test-scheduled # variables de runtime en .dev.vars (gitignoreado)
curl "http://localhost:8787/__scheduled?cron=0+12+*+*+*"  # dispara un cron
```

Límite del Worker: 10 MB comprimido. Medirlo con
`npx wrangler deploy --dry-run --outdir /tmp/cfout` (hoy ~6,8 MB).

Lo que el código tiene que respetar para correr en Workers está en
[context.md](ai-context/context.md), en "Hosting en Cloudflare Workers".
