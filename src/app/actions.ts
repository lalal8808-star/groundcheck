'use server';

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function registerUser(name: string, affiliation: string) {
  try {
    const result = await sql`
      INSERT INTO users (name, affiliation) VALUES (${name}, ${affiliation}) RETURNING id, name, affiliation
    `;
    return result[0];
  } catch (e: any) {
    throw new Error(`회원가입 실패: ${e.message}`);
  }
}

export async function uploadGrounding(data: {
  towerId: string;
  pointId: string;
  status: string;
  photoUrl: string; 
  userId: string;
}) {
  try {
    await sql`
      INSERT INTO grounding_logs (tower_id, point_id, status, photo_data, user_id) 
      VALUES (${data.towerId}, ${data.pointId}, ${data.status}, ${data.photoUrl}, ${data.userId})
    `;
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

export async function getLatestGrounding() {
  try {
    const result = await sql`
      WITH LatestLogs AS (
        SELECT DISTINCT ON (tower_id, point_id) 
          tower_id, point_id, status, photo_data, user_id, created_at
        FROM grounding_logs
        ORDER BY tower_id, point_id, created_at DESC
      )
      SELECT l.*, u.name as user_name, u.affiliation 
      FROM LatestLogs l
      LEFT JOIN users u ON l.user_id = u.id
    `;
    return result;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function uploadRegistry(title: string, fileUrl: string, userId: string) {
  try {
    await sql`
      INSERT INTO registries (title, file_data, user_id) VALUES (${title}, ${fileUrl}, ${userId})
    `;
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message };
  }
}

export async function getRegistries() {
  try {
    const result = await sql`
      SELECT id, title, user_id, created_at, u.name as user_name 
      FROM registries r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY created_at DESC
    `;
    return result;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getRegistryData(id: string) {
  try {
    const result = await sql`SELECT file_data FROM registries WHERE id = ${id}`;
    return result[0]?.file_data; 
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function deleteRegistry(id: string) {
  try {
    await sql`DELETE FROM registries WHERE id = ${id}`;
    revalidatePath('/');
  } catch (e: any) {
    throw new Error(e.message);
  }
}

export async function deleteGroundingLog(towerId: string, pointId: string) {
  try {
    await sql`
      DELETE FROM grounding_logs 
      WHERE id = (
        SELECT id FROM grounding_logs 
        WHERE tower_id = ${towerId} AND point_id = ${pointId} 
        ORDER BY created_at DESC 
        LIMIT 1
      )
    `;
    revalidatePath('/');
  } catch (e: any) {
    throw new Error(e.message);
  }
}

export async function togglePointExempt(towerId: string, pointId: string, userId: string, isExempt: boolean) {
  try {
    const status = isExempt ? 'exempt' : 'none';
    await sql`
      INSERT INTO grounding_logs (tower_id, point_id, status, user_id) 
      VALUES (${towerId}, ${pointId}, ${status}, ${userId})
    `;
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
