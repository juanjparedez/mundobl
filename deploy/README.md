# Servidor propio (fuera de Vercel)

Desde noviembre de 2026 MundoBL puede correr en un servidor propio con Docker,
porque Vercel Hobby pausaba la cuenta por cuotas de CPU e ISR. Supabase (base)
y Cloudflare R2 (imagenes) no cambian.

Que corre en el servidor (`deploy/compose.yml`):

| Servicio | Que hace                                                                  |
| -------- | ------------------------------------------------------------------------- |
| `app`    | Next.js en modo standalone (`Dockerfile`), puerto 3000 interno            |
| `caddy`  | HTTPS automatico con Let's Encrypt para `mundobl.com.ar` y `www`          |
| `cron`   | Los crons de `vercel.json`: `/api/cron/daily` 05:00 y `/alerts` 12:00 UTC |

El servidor elegido es **Oracle Cloud Always Free** (ARM, region Sao Paulo, al
lado de Supabase `sa-east-1`): 0 USD. Alternativa paga si Oracle no da
capacidad: Hetzner CX23 (~6 EUR/mes), mismos pasos desde el punto 3.

## 1. Crear el servidor (Oracle Cloud, una sola vez)

1. Cuenta en <https://signup.cloud.oracle.com>. **Home region: Brazil East
   (Sao Paulo)**; no se puede cambiar despues. Pide tarjeta solo para
   verificar.
2. Menu → Compute → Instances → **Create instance**:
   - Image: **Canonical Ubuntu 24.04**.
   - Shape: **Ampere → VM.Standard.A1.Flex**, 2 OCPU y 12 GB (entra en Always
     Free). Si dice "Out of capacity", probar otro Availability Domain o
     reintentar mas tarde.
   - Networking: crear VCN nueva con subnet publica y **Assign public IPv4**.
   - SSH keys: **Generate a key pair** y bajar la clave privada (`.key`).
3. En la instancia → Subnet → Security List por defecto → **Add Ingress
   Rules**: origen `0.0.0.0/0`, TCP puerto `80`; otra igual con `443`; otra
   UDP `443`.
4. Anotar la **Public IP** de la instancia.

## 2. Preparar el servidor

Desde PowerShell en la PC (la clave tiene que ser solo tuya o ssh la rechaza):

```powershell
icacls C:\ruta\ssh-key.key /inheritance:r /grant:r "$($env:USERNAME):(R)"
ssh -i C:\ruta\ssh-key.key ubuntu@IP_PUBLICA
```

Ya adentro del servidor:

```bash
curl -fsSL https://raw.githubusercontent.com/juanjparedez/mundobl/main/deploy/setup-server.sh | bash
exit
```

Volver a entrar con el mismo `ssh` (para que tome el grupo `docker`).

Si el repo es privado, el `git clone` del script falla: crear un token
fine-grained de solo lectura del repo en GitHub y clonar con
`git clone https://<TOKEN>@github.com/juanjparedez/mundobl.git ~/mundobl`.

## 3. Variables de entorno

Crear `~/mundobl/.env` con las mismas variables de produccion que tenia
Vercel. La forma mas facil, en la PC (Windows) dentro del repo:

```powershell
npx vercel@62.7.0 env pull .env.production --environment=production
scp -i C:\ruta\ssh-key.key .env.production ubuntu@IP_PUBLICA:~/mundobl/.env
Remove-Item .env.production
```

Revisar que tenga `NEXTAUTH_URL=https://mundobl.com.ar`, `AUTH_SECRET`,
`DATABASE_URL`, `DIRECT_URL` y `CRON_SECRET`. Las variables marcadas como
"Sensitive" en Vercel bajan vacias: esas hay que copiarlas de donde se
generaron (Supabase, Google Cloud, Resend...). Sacar las `VERCEL_*` que trae el
pull (no aplican) y no poner `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED`: la
analitica de Vercel no funciona fuera de Vercel.

## 4. Primer deploy

```bash
cd ~/mundobl && ./deploy/deploy.sh
```

El primer build tarda unos 10 minutos. Para probar antes de mover el dominio:

```bash
docker compose -f deploy/compose.yml exec caddy wget -qO- http://app:3000/robots.txt
```

## 5. Mover el dominio

En Cloudflare → `mundobl.com.ar` → DNS:

1. Registro `A` de `mundobl.com.ar`: borrar los de Vercel (`216.198.79.1`,
   `64.29.17.1`) y crear uno con la IP del servidor, **DNS only (nube gris)**.
2. `www`: registro `A` a la misma IP, nube gris.
3. Esperar 1–5 minutos: Caddy saca el certificado solo. Ver con
   `docker compose -f deploy/compose.yml logs caddy`.

Nube gris porque el certificado lo saca Caddy; si despues se quiere la CDN de
Cloudflare (nube naranja), poner SSL/TLS en **Full (strict)** antes.

Google OAuth no cambia: el dominio es el mismo.

## Deploys siguientes

Mergear a `main` y en el servidor: `cd ~/mundobl && ./deploy/deploy.sh`.
Si hay migraciones, correr antes `npm run migrate:supabase` desde la PC, igual
que con Vercel.

## Comandos utiles

```bash
docker compose -f deploy/compose.yml ps            # estado
docker compose -f deploy/compose.yml logs -f app   # logs de la app
docker compose -f deploy/compose.yml restart app   # reiniciar
```
