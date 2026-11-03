# Imagen de produccion para el servidor propio (deploy/README.md).
# Se construye EN el servidor: `deploy/deploy.sh`. Los tests usan Dockerfile.test.
#
# El .env de produccion entra al build como secret (no queda en ninguna capa):
# `next build` lo necesita para las NEXT_PUBLIC_* y para prerenderizar las
# paginas que leen la base.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --ignore-scripts

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 MUNDOBL_STANDALONE=1
ARG MUNDOBL_BUILD_SHA=""
ARG MUNDOBL_BUILD_COMMIT_DATE=""
ENV MUNDOBL_BUILD_SHA=$MUNDOBL_BUILD_SHA MUNDOBL_BUILD_COMMIT_DATE=$MUNDOBL_BUILD_COMMIT_DATE
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=secret,id=env,target=/app/.env npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd --system app && useradd --system --gid app app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
