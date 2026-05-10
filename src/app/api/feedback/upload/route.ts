import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { uploadImage } from '@/lib/supabase';
import { processPosterImage } from '@/lib/image-processing';

// POST /api/feedback/upload — sube una imagen para adjuntar a un feedback /
// feature request. Cualquier usuario logueado (no requiere ADMIN), a
// diferencia de /api/upload que es para portadas de series y require role.
// Mismo pipeline: validacion de tipo + size, processPosterImage, supabase.
//
// Folder forzado a `feedback/{userId}` para namespace por usuario y poder
// listar/limpiar por owner si despues se necesita (ej. caso eliminado o
// user dado de baja). El client no controla el folder.
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only images are allowed (JPEG, PNG, WebP, GIF)',
        },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const original = Buffer.from(bytes);
    const processed = await processPosterImage(original, file.type);

    const timestamp = Date.now();
    const baseName = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .slice(0, 60);
    const filename = `${timestamp}_${baseName || 'image'}.${processed.ext}`;
    const path = `feedback/${authResult.userId}/${filename}`;

    const imageUrl = await uploadImage(
      processed.buffer,
      path,
      processed.contentType
    );

    return NextResponse.json({
      url: imageUrl,
      filename,
      size: processed.buffer.length,
      type: processed.contentType,
    });
  } catch (error) {
    console.error('Error uploading feedback file:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
}
