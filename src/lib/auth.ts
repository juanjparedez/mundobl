import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/database';
import type { Role } from '@/generated/prisma';

// Cuanto confiar en el role/banned "horneado" en el JWT antes de
// re-consultar la DB. Sin esto, PrismaAdapter fuerza estrategia de sesion
// "database" (default de NextAuth apenas hay adapter): cada auth() —
// llamado en CADA request logueado desde src/proxy.ts, que corre en
// runtime Node (Prisma no soporta Edge) — pegaba una query a Session+User.
// Con 246k invocaciones/mes eso fue la causa principal de exceder Fluid
// Active CPU (detectado 2026-09-04). JWT puro eliminaria el costo del
// todo, pero un baneo o cambio de rol tardaria hasta season.maxAge (30
// dias por default) en aplicarse. Este refresh periodico es el balance:
// ~99% de las requests no tocan la DB, un baneo tarda como maximo
// ROLE_REFRESH_MS en hacer efecto.
const ROLE_REFRESH_MS = 20 * 60 * 1000;

// El campo extra que guardamos en el JWT. No se tipa via module
// augmentation de '@auth/core/jwt' — ver el comentario en
// src/types/next-auth.d.ts sobre por que no funciona en este repo — asi
// que se castea localmente donde hace falta.
interface AppJwtExtra {
  id: string;
  role: Role;
  banned: boolean;
  roleCheckedAt: number;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Solo cambia COMO se valida la sesion (JWT firmado vs. row en la tabla
  // Session) — el adapter sigue manejando User/Account/OAuth como siempre.
  session: { strategy: 'jwt' },
  // En NextAuth v5 cuando el Host header difiere de NEXTAUTH_URL (ej. dev
  // local en localhost:3000 mientras NEXTAUTH_URL=https://mundobl.com.ar),
  // tira "Server error - problem with server configuration" salvo que
  // confiemos en el host. Vercel ya seta esto a true en prod, pero en
  // local hay que forzarlo explicito.
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  events: {
    async createUser({ user }) {
      const adminEmails = (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      if (user.email && adminEmails.includes(user.email)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' },
        });
      }
    },
  },
  callbacks: {
    async signIn({ user }) {
      const adminEmails = (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      if (user.email && adminEmails.includes(user.email)) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (existingUser && existingUser.role !== 'ADMIN') {
          await prisma.user.update({
            where: { email: user.email },
            data: { role: 'ADMIN' },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      const appToken = token as unknown as AppJwtExtra;

      if (user) {
        // Login recien hecho (o primer JWT tras crear cuenta): `user`
        // viene del adapter con el row completo de la DB.
        const dbUser = user as unknown as { role: Role; banned: boolean };
        appToken.id = user.id!;
        appToken.role = dbUser.role;
        appToken.banned = dbUser.banned;
        appToken.roleCheckedAt = Date.now();
        return token;
      }

      const checkedAt = appToken.roleCheckedAt ?? 0;
      if (Date.now() - checkedAt < ROLE_REFRESH_MS) {
        return token; // Token todavia fresco: no tocar la DB.
      }

      // Token vencido: re-chequear role/banned. Fail-closed (banned=true)
      // si el user ya no existe — mas seguro que dejar pasar un token
      // huerfano hasta que expire solo.
      const fresh = await prisma.user.findUnique({
        where: { id: appToken.id },
        select: { role: true, banned: true },
      });
      appToken.role = fresh?.role ?? appToken.role;
      appToken.banned = fresh ? fresh.banned : true;
      appToken.roleCheckedAt = Date.now();
      return token;
    },
    async session({ session, token }) {
      const appToken = token as unknown as AppJwtExtra;
      if (session.user) {
        session.user.id = appToken.id;
        session.user.role = appToken.role;
        session.user.banned = appToken.banned;
      }
      return session;
    },
  },
});
