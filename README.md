# MundoBL

Catalogo de series asiaticas BL/GL (Boys' Love / Girls' Love) y otros generos. Curaduria, calificacion, seguimiento y descubrimiento.

**Sitio**: [mundobl.com.ar](https://mundobl.com.ar)

---

## Para desarrolladores

Toda la documentacion tecnica del proyecto vive en [`context.md`](context.md):

- Stack y arquitectura
- Estructura del repo y convenciones
- Variables de entorno + integraciones externas (YouTube, Vimeo, Gemini, Supabase)
- Flujos de catalogo, importacion, privacy
- Guia de cambios comunes (agregar pagina, endpoint, integracion)

El changelog historico vive en [`CHANGELOG.md`](CHANGELOG.md) y se importa al panel admin (`ChangelogItem` en DB) — la fuente de verdad publica esta en [/novedades](https://mundobl.com.ar/novedades).

## Comandos basicos

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # produccion
npm run lint:fix
npm run type-check
```

Para migraciones de Prisma, ver `context.md` → seccion "Base de Datos".

---

## Equipo

| Rol | |
|---|---|
| Desarrollador | Juan |
| Product Owner / Curaduria | Flor |
