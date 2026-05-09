// ============================================
// Display name publico de un User
// ============================================
//
// Reglas (de mas especifico a mas generico):
//   1. Si tiene `nickname` seteado → usar nickname (con trim).
//   2. Si tiene `name` "Nombre Apellido" → "Nombre A." (inicial del
//      apellido, para no exponer apellido completo).
//   3. Si solo hay un token en `name` → usarlo tal cual.
//   4. Si no hay nada → "Anonimo".
//
// El sidebar y otros lugares donde el usuario ve SU PROPIO nombre
// pueden seguir mostrando `user.name` directo. Esta funcion es para
// contextos PUBLICOS donde otros usuarios ven el nombre.

export interface UserDisplayInput {
  name?: string | null;
  nickname?: string | null;
}

export function formatPublicName(
  user: UserDisplayInput | null | undefined
): string {
  if (!user) return 'Anonimo';

  const nickname = user.nickname?.trim();
  if (nickname) return nickname;

  const name = user.name?.trim();
  if (!name) return 'Anonimo';

  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) return tokens[0] ?? 'Anonimo';

  const first = tokens[0];
  const lastInitial = tokens[tokens.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

// Para iniciales de avatar (1-2 caracteres). Usa nickname si esta;
// fallback a iniciales de name.
export function getInitials(user: UserDisplayInput | null | undefined): string {
  if (!user) return '?';
  const nickname = user.nickname?.trim();
  if (nickname) return nickname.charAt(0).toUpperCase();
  const name = user.name?.trim();
  if (!name) return '?';
  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length === 1) return tokens[0].charAt(0).toUpperCase();
  return (
    tokens[0].charAt(0).toUpperCase() +
    tokens[tokens.length - 1].charAt(0).toUpperCase()
  );
}
