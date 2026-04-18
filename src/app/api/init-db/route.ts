import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin0000';

export async function GET(request: Request) {
  // 관리자 토큰 검증 (쿼리 파라미터 또는 헤더)
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') || request.headers.get('x-admin-token');
  if (token !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Create Projects table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_number TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        project_name TEXT NOT NULL DEFAULT '',
        construction_section TEXT DEFAULT '',
        line_name TEXT DEFAULT '',
        tower_configs JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        affiliation TEXT NOT NULL,
        project_id UUID REFERENCES projects(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Grounding Logs table
    await sql`
      CREATE TABLE IF NOT EXISTS grounding_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tower_id TEXT NOT NULL,
        point_id TEXT NOT NULL,
        status TEXT NOT NULL,
        photo_data TEXT,
        user_id UUID REFERENCES users(id),
        project_id UUID REFERENCES projects(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Registries table
    await sql`
      CREATE TABLE IF NOT EXISTS registries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        user_id UUID REFERENCES users(id),
        project_id UUID REFERENCES projects(id),
        file_data TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Migration: add columns to existing tables if missing
    try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id)`; } catch {}
    try { await sql`ALTER TABLE grounding_logs ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id)`; } catch {}
    try { await sql`ALTER TABLE registries ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id)`; } catch {}
    try { await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL`; } catch {}
    // GPS 좌표
    try { await sql`ALTER TABLE grounding_logs ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION`; } catch {}
    try { await sql`ALTER TABLE grounding_logs ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION`; } catch {}
    try { await sql`ALTER TABLE grounding_logs ADD COLUMN IF NOT EXISTS location_accuracy DOUBLE PRECISION`; } catch {}

    return NextResponse.json({ message: 'Tables created/migrated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
