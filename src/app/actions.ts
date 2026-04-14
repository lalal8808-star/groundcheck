'use server';

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function registerUser(name: string, affiliation: string) {
  const result = await sql(
    'INSERT INTO users (name, affiliation) VALUES ($1, $2) RETURNING id, name, affiliation',
    [name, affiliation]
  );
  return result[0];
}

export async function uploadGrounding(data: {
  towerId: string;
  pointId: string;
  status: string;
  photoData: string;
  userId: string;
}) {
  await sql(
    'INSERT INTO grounding_logs (tower_id, point_id, status, photo_data, user_id) VALUES ($1, $2, $3, $4, $5)',
    [data.towerId, data.pointId, data.status, data.photoData, data.userId]
  );
  revalidatePath('/');
}

export async function getLatestGrounding() {
  // We want the latest status for each point
  const result = await sql(`
    WITH LatestLogs AS (
      SELECT DISTINCT ON (tower_id, point_id) 
        tower_id, point_id, status, photo_data, user_id, created_at
      FROM grounding_logs
      ORDER BY tower_id, point_id, created_at DESC
    )
    SELECT l.*, u.name as user_name, u.affiliation 
    FROM LatestLogs l
    LEFT JOIN users u ON l.user_id = u.id
  `);
  return result;
}

export async function uploadRegistry(title: string, fileData: string, userId: string) {
  await sql(
    'INSERT INTO registries (title, file_data, user_id) VALUES ($1, $2, $3)',
    [title, fileData, userId]
  );
  revalidatePath('/');
}

export async function getRegistries() {
  const result = await sql(`
    SELECT r.*, u.name as user_name 
    FROM registries r
    LEFT JOIN users u ON r.user_id = u.id
    ORDER BY created_at DESC
  `);
  return result;
}

export async function deleteRegistry(id: string) {
  await sql('DELETE FROM registries WHERE id = $1', [id]);
  revalidatePath('/');
}

export async function deleteGroundingLog(towerId: string, pointId: string) {
  // Delete the latest log for this point
  await sql(`
    DELETE FROM grounding_logs 
    WHERE id = (
      SELECT id FROM grounding_logs 
      WHERE tower_id = $1 AND point_id = $2 
      ORDER BY created_at DESC 
      LIMIT 1
    )
  `, [towerId, pointId]);
  revalidatePath('/');
}
