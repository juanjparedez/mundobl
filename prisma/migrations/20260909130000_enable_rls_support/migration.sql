-- Enable Row Level Security en las tablas de soporte.
--
-- Se omitio por error en 20260907140000_add_support_threads. Mismo criterio
-- que el resto del schema (ver 20260501080108_enable_rls): Prisma se conecta
-- con el rol owner, que tiene BYPASSRLS, asi que activar RLS sin policies
-- cierra PostgREST sin tocar la app.
--
-- Es especialmente importante aca: son conversaciones PRIVADAS entre un
-- colaborador y curaduria. Sin RLS, cualquiera con la anon key (que es
-- publica por definicion, viaja en el bundle) podia leerlas enteras.
ALTER TABLE "SupportThread" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportMessage" ENABLE ROW LEVEL SECURITY;
