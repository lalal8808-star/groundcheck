import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // Create Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        affiliation TEXT NOT NULL,
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Registries table (Grounding Register)
    await sql`
      CREATE TABLE IF NOT EXISTS registries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        user_id UUID REFERENCES users(id),
        file_data TEXT, 
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return NextResponse.json({ message: 'Tables created successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
