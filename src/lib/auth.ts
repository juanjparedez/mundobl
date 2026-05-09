import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/database';
import type { Role } from '@/generated/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = user as unknown as { role: Role; banned: boolean };
        session.user.role = dbUser.role;
        session.user.banned = dbUser.banned;
      }
      return session;
    },
  },
});
