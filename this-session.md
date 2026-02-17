Archivos modificados (~30)
Schema: prisma/schema.prisma - Role enum, User, Account, Session, VerificationToken, UserRating, Comment (+ userId), ViewStatus (+ userId, compound uniques)
Layout: src/app/layout.tsx - SessionProvider wrapper
Sidebar: Login/logout, menú admin condicional por rol
BottomNav: Login/admin condicional
CommentsSection: Form solo si logueado, avatar de usuario
RatingSection: Puntuación oficial (admin) + puntuación de usuarios (pública)
ViewStatusToggle: Controles solo si logueado, read-only si no
~24 rutas API: Protección con requireAuth()/requireRole()
navigation.ts: Ruta /admin/usuarios
Pasos para activar
Crear credenciales OAuth en Google Cloud Console
Agregar a .env:

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUTH_SECRET=... # generar con: npx auth secret
ADMIN_EMAIL=<email de Flor>
Ejecutar migración: npx prisma migrate dev --name add_auth
Login con Google. Flor se auto-asigna como ADMIN
Ejecutar script de datos: npx tsx scripts/assign-existing-data.ts
Todo está implementado y el type-check pasa limpio. El resumen que te dejé arriba tiene los pasos para activar. Para recapitular lo más importante:

Para que funcione, necesitás:
Crear credenciales OAuth en Google Cloud Console

Ir a console.cloud.google.com > APIs & Services > Credentials
Crear OAuth 2.0 Client ID
Agregar redirect URIs: https://mundobl.win/api/auth/callback/google y http://localhost:3000/api/auth/callback/google
Variables de entorno (.env local + Vercel):

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUTH_SECRET=... # generar con: npx auth secret
ADMIN_EMAIL=<email de Flor>
Migrar la base de datos:

npx prisma migrate dev --name add_auth
Después del primer login de Flor, ejecutar:

npx tsx scripts/assign-existing-data.ts
Esto asigna los comentarios y estados de visto existentes a su usuario.
