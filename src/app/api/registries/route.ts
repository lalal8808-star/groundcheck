import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await sql`
      SELECT r.id, r.title, r.user_id, r.created_at::text as created_at, u.name as user_name 
      FROM registries r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `;
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[api/registries]', e);
    return NextResponse.json([], { status: 200 });
  }
}
