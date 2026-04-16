import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const processed = await sharp(buffer)
      .rotate()                              // EXIF 회전 자동 보정
      .resize(1000, 1000, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 60, progressive: true })
      .toBuffer();

    const base64 = processed.toString('base64');
    return NextResponse.json({ dataUrl: `data:image/jpeg;base64,${base64}` });
  } catch (error: any) {
    console.error('[process-image] error:', error);
    return NextResponse.json({ error: error.message || 'Processing failed' }, { status: 500 });
  }
}
