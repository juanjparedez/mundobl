/* eslint-disable no-console */
import 'dotenv/config';
import { OFFICIAL_CHANNELS } from '../src/lib/official-channels';

/**
 * Resuelve el channelId (UC...) de cada handle de la lista blanca de canales
 * oficiales, para pegarlo en src/lib/official-channels.ts. Los IDs son
 * estables; los handles pueden cambiar. Consume 1 unidad de cuota por canal.
 *
 * Uso:
 *   npx tsx scripts/resolve-official-channel-ids.ts
 */
async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY no esta seteado. Agregalo al .env.');
    process.exit(1);
  }

  for (const ch of OFFICIAL_CHANNELS) {
    const params = new URLSearchParams({
      part: 'id,snippet',
      forHandle: ch.handle,
      key: apiKey,
    });
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`
    );
    const data = (await res.json()) as {
      items?: Array<{ id: string; snippet?: { title?: string } }>;
      error?: { message?: string };
    };
    const item = data.items?.[0];
    const status = item
      ? `${item.id}  "${item.snippet?.title ?? ''}"`
      : `NO ENCONTRADO (${data.error?.message ?? 'sin items'})`;
    const marker =
      item && ch.channelId && item.id !== ch.channelId ? '  <-- DIFIERE' : '';
    console.log(
      `${ch.name.padEnd(18)} @${ch.handle.padEnd(26)} ${status}${marker}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
