# Case Study: Arquitectura de MundoBL — Escalabilidad, Costos y Consistencia

> **Producto:** [mundobl.com.ar](https://mundobl.com.ar)  
> **Autor / Ingeniería:** Juan Paredez  
> **Product Owner & Curaduría:** Flor  
> **Estado:** En producción continua desde febrero de 2026

---

## 1. Resumen Ejecutivo y Métricas Reales (Octubre 2026)

MundoBL es una plataforma web especializada en la catalogación, seguimiento, curaduría editorial y streaming oficial embebido de producciones audiovisuales asiáticas (BL/GL). 

- **Escala real en producción:** **~174 usuarios registrados**, **~763 series y películas catalogadas**.
- **Modelo colaborativo real:** Diseñado bajo los requerimientos de una Product Owner dedicada (Flor), con flujos para colaboradores externos y curaduría concurrente.
- **Stack tecnológico:** Next.js 16 (App Router), React 19, TypeScript estricto (0 `any`), Prisma 7, PostgreSQL (Supabase / local Docker).

---

## 2. Los 6 Pilares de Arquitectura Técnica

### 1. Co-ubicación y Reducción de Latencia (`gru1` ↔ `sa-east-1`)
- **Problema:** Inicialmente las funciones serverless de Vercel corrían en la región predeterminada `iad1` (Washington, EE.UU.), mientras que la base de datos PostgreSQL en Supabase reside en `sa-east-1` (São Paulo, Brasil). Cada consulta a la base cruzaba el continente con un viaje de ida y vuelta de ~130 ms. En operaciones complejas (como guardar una serie con relaciones), el tiempo total de procesamiento alcanzaba los 6–8 segundos, agotando la cuota mensual de CPU serverless de Vercel.
- **Solución:** Reconfiguración explícita de `vercel.json` para ejecutar las funciones lambda en la región `gru1` (São Paulo), co-ubicadas con el pooler de la base de datos.
- **Impacto:** La latencia por consulta cayó de **~130 ms a menos de 10 ms**, reduciendo drásticamente el tiempo de ejecución facturable de CPU a una fracción sin costo adicional de cómputo.

### 2. Optimización de Payload e ISR: Compresión a 5.8 KB gzip
- **Problema:** El explorador del catálogo enviaba inicialmente la entidad completa de cada serie (sinopsis extensas, notas privadas, elencos completos), produciendo un payload JSON inicial de más de **1.017 KB**.
- **Solución:** 
  1. Se implementó una proyección liviana (`getCatalogSeries`) que extrae únicamente los campos indispensables para el renderizado de tarjetas.
  2. El transporte comprime los metadatos compartidos, bajando el JSON transferido a **183 KB** (apenas **5.8 KB gzipped**).
  3. Las sinopsis y datos extensos se desacoplaron a una API micro-endpoint bajo demanda (`/api/series/[id]/preview`) con TTL de caché de 6 horas, que se revalida automáticamente solo cuando un curador edita la serie.

### 3. Concurrencia Editorial y Auditoría (`editVersion` y `SeriesRevision`)
- **Problema:** Múltiples editores y colaboradores externos actualizan títulos simultáneamente. Si un editor guardaba desde una pestaña abierta horas antes, sobrescribía inadvertidamente el trabajo reciente de otro curador.
- **Solución:** 
  - Control de concurrencia optimista mediante el campo atómico `Series.editVersion`. Si la versión enviada no coincide exactamente con la vigente en base de datos, el servidor rechaza la transacción con `409 EDIT_CONFLICT`.
  - Antes de persistir cualquier mutación en el formulario, se dispara un snapshot JSON inmutable en la tabla `SeriesRevision` (registrando autor, timestamp y contenido previo). Al no tener clave foránea restrictiva, la auditoría sobrevive incluso a la eliminación de la serie.

### 4. Resiliencia Operativa: Backups en R2 con Test de Restauración en CI
- **Problema:** En sistemas de producción, un backup que no se prueba periódicamente genera una falsa sensación de seguridad.
- **Solución:**
  - Se configuró un workflow automatizado de volcado de base de datos (`backup.yml`) que comprime y resguarda los dumps en Cloudflare R2 con retención rotativa.
  - Se implementó un arnés de prueba continua (`backup-restore-test.yml`): en cada ejecución, un runner de GitHub Actions provisiona un contenedor PostgreSQL 16 limpio y descartable, descarga el backup de R2, ejecuta la restauración completa y corre un script de verificación que comprueba la integridad referencial, el recuento de tablas y la consistencia de datos.

### 5. Gobernanza de Internacionalización (10 Idiomas y 3.481 Claves)
- **Problema:** Ofrecer soporte exhaustivo en 10 idiomas (`es`, `en`, `it`, `de`, `fr`, `ja`, `ko`, `zh-CN`, `zh-TW`, `th`) suele derivar en desincronización de textos o claves faltantes en tiempo de ejecución.
- **Solución:** Arnés automatizado de comprobación de locales que audita en CI la consistencia estructural y la presencia obligatoria de las **3.481 claves** en los 10 diccionarios. La carga es dinámica y asíncrona para no penalizar el bundle inicial de JavaScript del cliente.

### 6. Modelo Relacional Complejo (78 Modelos Prisma y 56 Migraciones)
- **Dominio:** La aplicación modela un grafo relacional profundo:
  - Producciones, temporadas, episodios y especiales.
  - Universos compartidos y franquicias (*shared universes*).
  - Elenco multidimensional (actores, directores, guionistas, productoras) y roles de colaboradores externos con permisos acotados a su propio contenido.
  - Sistema de calificación multicriterio (química, trama, casting, banda sonora, ritmo) y logros derivados de la actividad real del usuario sin telemetría invasiva.
- **Control de esquema:** 56 migraciones atómicas aplicadas progresivamente, probadas previamente en Docker local antes de impactar producción.

---

## 3. Conclusión

MundoBL demuestra que una aplicación de nicho puede construirse con los mismos estándares de ingeniería de una empresa de software de primer nivel: optimización consciente de recursos serverless, seguridad relacional estricta, control de costos y disciplina operativa verificada.
