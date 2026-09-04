import type { Role } from '@/generated/prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      banned: boolean;
    };
  }
}

// NO se aumenta 'next-auth/jwt' / '@auth/core/jwt' aca: el repo tiene dos
// copias de @auth/core con versiones distintas (node_modules/@auth/core@
// 0.41.1 hoisted vs next-auth/node_modules/@auth/core@0.41.0, que next-auth
// pide exacto) — la augmentation pega en una copia que no es la que usan
// los callbacks de NextAuth internamente, asi que TypeScript no la ve. El
// tipado de `token` en callbacks.jwt de src/lib/auth.ts se resuelve con
// casteo local en vez de depender de esto.
