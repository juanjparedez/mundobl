-- Documenta la decision de arquitectura sobre RLS en este schema.
-- El Security Advisor de Supabase reporta "RLS Enabled No Policy" como Info
-- en todas las tablas; ese ruido es esperado e intencional.
COMMENT ON SCHEMA "public" IS 'Acceso solo via Prisma con rol owner (BYPASSRLS). RLS habilitado sin policies para bloquear PostgREST publico — esto es intencional, no agregar policies a menos que se empiece a usar supabase-js con anon key para queries a tablas (hoy supabase-js solo se usa para Storage).';
