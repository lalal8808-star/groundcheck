import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Missing projectId or userId' }, { status: 400 });
    }

    // 해당 유저가 실제로 프로젝트 소속인지 DB 검증
    const member = await sql`
      SELECT id FROM users WHERE id = ${userId} AND project_id = ${projectId}
    `;
    if (member.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await sql`
      SELECT r.id, r.title, r.user_id, r.created_at::text as created_at, u.name as user_name
      FROM registries r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.project_id = ${projectId}
      ORDER BY r.created_at DESC
    `;
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[api/registries]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
