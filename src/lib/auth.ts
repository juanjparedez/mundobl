import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/database';
import type { Role } from '@/generated/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
        session.user.role = (user as unknown as { role: Role }).role;
      }
      return session;
    },
  },
});
