import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const registries = await sql`
      SELECT id, title, user_id, created_at::text as created_at, 
             length(file_data) as file_size
      FROM registries 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    
    return NextResponse.json({ tables, registries, count: registries.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
