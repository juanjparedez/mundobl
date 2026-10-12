import { Prisma, type PrismaClient } from '@/generated/prisma';
import {
  EMPTY_SUPPORT,
  isSupportOwner,
  parseSupportContent,
  SupportError,
  type parseSupportMutation,
} from './support-input';
export function createSupportRepository(db: PrismaClient) {
  async function requireOwner(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true, banned: true },
    });
    if (!user || !isSupportOwner(user, process.env.ADMIN_EMAILS ?? ''))
      throw new SupportError(403, 'error');
  }
  async function getSupportAdmin(userId: string) {
    await requireOwner(userId);
    const row = await db.supportSettings.findUnique({ where: { id: 1 } });
    return {
      draft: row ? parseSupportContent(row.draft) : EMPTY_SUPPORT,
      enabled: row?.enabled ?? false,
      version: row?.version ?? 0,
      updatedAt: row?.updatedAt.toISOString() ?? null,
    };
  }
  async function getSupportPublic() {
    const row = await db.supportSettings.findUnique({
      where: { id: 1 },
      select: { enabled: true, published: true },
    });
    if (!row?.enabled || !row.published) return null;
    const content = parseSupportContent(row.published, true);
    return { ...content, methods: content.methods.filter((m) => m.enabled) };
  }
  async function mutateSupport(
    userId: string,
    input: ReturnType<typeof parseSupportMutation>
  ) {
    await requireOwner(userId);
    await db.$transaction(async (tx) => {
      await tx.supportSettings.createMany({
        data: [
          { id: 1, draft: { intro: '', purpose: '', thanks: '', methods: [] } },
        ],
        skipDuplicates: true,
      });
      const row = await tx.supportSettings.findUniqueOrThrow({
        where: { id: 1 },
      });
      if (row.version !== input.version)
        throw new SupportError(409, 'conflict');
      const data: Prisma.SupportSettingsUpdateManyMutationInput = {
        version: { increment: 1 },
        updatedBy: userId,
      };
      if (input.action === 'save')
        data.draft = JSON.parse(
          JSON.stringify(input.content)
        ) as Prisma.InputJsonValue;
      if (input.action === 'publish') {
        const content = parseSupportContent(row.draft, true);
        content.methods = content.methods
          .filter((m) => m.enabled)
          .map((m) =>
            m.kind === 'link'
              ? { ...m, alias: '', holder: '', bank: '', currency: '' }
              : { ...m, url: '' }
          );
        data.published = JSON.parse(
          JSON.stringify(content)
        ) as Prisma.InputJsonValue;
        data.enabled = true;
      }
      if (input.action === 'hide') data.enabled = false;
      const changed = await tx.supportSettings.updateMany({
        where: { id: 1, version: input.version },
        data,
      });
      if (changed.count !== 1) throw new SupportError(409, 'conflict');
    });
    return getSupportAdmin(userId);
  }
  return {
    requireSupportOwner: requireOwner,
    getSupportAdmin,
    getSupportPublic,
    mutateSupport,
  };
}
