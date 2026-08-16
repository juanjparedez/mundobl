import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { requireRole } from '@/lib/auth-helpers';
import { generateText } from '@/lib/gemini';

export async function POST() {
  const auth = await requireRole(['ADMIN']);
  if (!auth.authorized) return auth.response;

  try {
    // Obtener los últimos 30 commits
    let gitLog = '';
    try {
      gitLog = execSync('git log -n 30 --pretty=format:"%h %s"', {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } catch {
      gitLog = '';
    }

    if (!gitLog.trim()) {
      return NextResponse.json(
        { error: 'No se pudieron leer los commits del repositorio.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const versionLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const prompt = `Sos el redactor de notas de lanzamiento (changelog) de MundoBL (https://mundobl.com.ar), la plataforma comunitaria y catálogo de series BL/GL asiáticas curadas.

A partir de los siguientes commits recientes de git del repositorio, redactá una entrada de changelog clara, atractiva y concisa en español para los usuarios finales.

COMMITS:
${gitLog}

INSTRUCCIONES:
- Clasificá los cambios en 3 categorías: "Features", "Fixes", "UX / Rendimiento".
- Usá viñetas con formato markdown que comiencen con el concepto en negrita, por ejemplo:
  - **Catálogo /ver ampliado**: Se sumaron nuevas series oficiales reproducibles...
- Omití cambios puramente internos que no aporten valor al usuario (como refactors invisibles o typos en tests).
- Responde estrictamente con un JSON válido con la siguiente estructura:
{
  "version": "${versionLabel}",
  "title": "Título descriptivo del release (ej: Catálogo /ver, optimización mobile y nuevas funciones)",
  "features": ["bullet 1", "bullet 2"],
  "fixes": ["bullet 1", "bullet 2"],
  "improvements": ["bullet 1", "bullet 2"]
}`;

    const rawResponse = await generateText({
      prompt,
      temperature: 0.3,
      responseMimeType: 'application/json',
    });

    const parsed = JSON.parse(rawResponse);
    return NextResponse.json({ ok: true, draft: parsed });
  } catch (err) {
    console.error('Error auto-generating changelog:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Error al generar el changelog con IA.',
      },
      { status: 500 }
    );
  }
}
