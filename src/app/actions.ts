'use server';

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const BCRYPT_ROUNDS = 10;

/** 관리자 비밀번호 검증 — 환경변수가 없으면 항상 실패 (안전한 기본값) */
function verifyAdminPassword(input: string): boolean {
  if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) return false;
  return input === ADMIN_PASSWORD;
}

// ── Helpers ──────────────────────────────────────────────────────

/** 비밀번호가 bcrypt 해시인지 확인 */
function isBcryptHash(pw: string) {
  return /^\$2[ab]\$/.test(pw);
}

/** 비밀번호 해싱 */
async function hashPassword(pw: string) {
  return bcrypt.hash(pw, BCRYPT_ROUNDS);
}

/**
 * userId가 실제로 해당 projectId 소속인지 DB에서 검증.
 * 서버 액션에서 클라이언트가 넘겨준 id 쌍을 신뢰하지 않기 위해 사용.
 */
async function assertUserBelongsToProject(userId: string, projectId: string) {
  const rows = await sql`
    SELECT id FROM users WHERE id = ${userId} AND project_id = ${projectId}
  `;
  if (rows.length === 0) {
    throw new Error('접근 권한이 없습니다.');
  }
}

// ── Project actions ─────────────────────────────────────────────

export async function createProject(adminPassword: string, projectNumber: string, password: string, projectName: string) {
  if (!verifyAdminPassword(adminPassword)) {
    return { success: false, error: '관리자 비밀번호가 올바르지 않습니다.' };
  }
  if (!projectNumber || !password || !projectName) {
    return { success: false, error: '모든 항목을 입력해주세요.' };
  }
  if (projectNumber.length > 50 || password.length > 100 || projectName.length > 100) {
    return { success: false, error: '입력값이 너무 깁니다.' };
  }
  try {
    const hashed = await hashPassword(password);
    const result = await sql`
      INSERT INTO projects (project_number, password, project_name)
      VALUES (${projectNumber}, ${hashed}, ${projectName})
      RETURNING id, project_number, project_name, construction_section, line_name, tower_configs
    `;
    return { success: true, data: result[0] };
  } catch (e: any) {
    if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
      return { success: false, error: '이미 존재하는 사업번호입니다.' };
    }
    return { success: false, error: '사업 생성에 실패했습니다.' };
  }
}

export async function getAdminProjects(adminPassword: string) {
  if (!verifyAdminPassword(adminPassword)) {
    return { success: false as const, error: '관리자 비밀번호가 올바르지 않습니다.' };
  }
  try {
    const result = await sql`
      SELECT id, project_number, project_name, created_at::text,
             deleted_at::text
      FROM projects
      ORDER BY deleted_at NULLS FIRST, created_at DESC
    `;
    return { success: true as const, data: result };
  } catch {
    return { success: false as const, error: '사업 목록 조회에 실패했습니다.' };
  }
}

export async function deleteProject(adminPassword: string, projectId: string) {
  if (!verifyAdminPassword(adminPassword)) {
    return { success: false, error: '관리자 비밀번호가 올바르지 않습니다.' };
  }
  try {
    await sql`UPDATE projects SET deleted_at = NOW() WHERE id = ${projectId}`;
    return { success: true };
  } catch {
    return { success: false, error: '삭제에 실패했습니다.' };
  }
}

export async function purgeProject(adminPassword: string, projectId: string) {
  if (!verifyAdminPassword(adminPassword)) {
    return { success: false, error: '관리자 비밀번호가 올바르지 않습니다.' };
  }
  try {
    await sql`DELETE FROM grounding_logs WHERE project_id = ${projectId}`;
    await sql`DELETE FROM registries      WHERE project_id = ${projectId}`;
    await sql`DELETE FROM users           WHERE project_id = ${projectId}`;
    await sql`DELETE FROM projects        WHERE id         = ${projectId}`;
    return { success: true };
  } catch {
    return { success: false, error: '완전 삭제에 실패했습니다.' };
  }
}

export async function restoreProject(adminPassword: string, projectId: string) {
  if (!verifyAdminPassword(adminPassword)) {
    return { success: false, error: '관리자 비밀번호가 올바르지 않습니다.' };
  }
  try {
    await sql`UPDATE projects SET deleted_at = NULL WHERE id = ${projectId}`;
    return { success: true };
  } catch {
    return { success: false, error: '복원에 실패했습니다.' };
  }
}

export async function updateProjectCredentials(
  adminPassword: string,
  projectId: string,
  newProjectNumber: string,
  newPassword: string,
) {
  if (!verifyAdminPassword(adminPassword)) {
    return { success: false, error: '관리자 비밀번호가 올바르지 않습니다.' };
  }
  if (!newProjectNumber) {
    return { success: false, error: '사업번호를 입력해주세요.' };
  }
  if (newProjectNumber.length > 50 || newPassword.length > 100) {
    return { success: false, error: '입력값이 너무 깁니다.' };
  }
  try {
    if (newPassword) {
      const hashed = await hashPassword(newPassword);
      await sql`
        UPDATE projects SET project_number = ${newProjectNumber}, password = ${hashed}
        WHERE id = ${projectId}
      `;
    } else {
      await sql`
        UPDATE projects SET project_number = ${newProjectNumber}
        WHERE id = ${projectId}
      `;
    }
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
      return { success: false, error: '이미 존재하는 사업번호입니다.' };
    }
    return { success: false, error: '수정에 실패했습니다.' };
  }
}

export async function loginToProject(name: string, affiliation: string, projectNumber: string, password: string) {
  if (!name || !affiliation || !projectNumber || !password) {
    return { success: false as const, error: '모든 항목을 입력해주세요.' };
  }
  if (name.length > 50 || affiliation.length > 100 || projectNumber.length > 50 || password.length > 100) {
    return { success: false as const, error: '입력값이 너무 깁니다.' };
  }
  try {
    // 사업번호 존재 여부 먼저 확인 (에러 메시지 구분용)
    const byNumber = await sql`
      SELECT id, password FROM projects WHERE project_number = ${projectNumber} AND deleted_at IS NULL
    `;
    if (byNumber.length === 0) {
      return { success: false as const, error: '사업번호를 찾을 수 없습니다.' };
    }

    const stored = byNumber[0].password as string;
    const projectId = byNumber[0].id as string;

    // 비밀번호 검증 (bcrypt 해시 또는 평문 호환 — 평문이면 자동 업그레이드)
    let passwordOk = false;
    if (isBcryptHash(stored)) {
      passwordOk = await bcrypt.compare(password, stored);
    } else {
      // 구버전 평문 비밀번호 → 일치하면 bcrypt로 즉시 업그레이드
      passwordOk = stored === password;
      if (passwordOk) {
        const upgraded = await hashPassword(password);
        await sql`UPDATE projects SET password = ${upgraded} WHERE id = ${projectId}`;
      }
    }
    if (!passwordOk) {
      return { success: false as const, error: '비밀번호가 올바르지 않습니다.' };
    }

    // 프로젝트 상세 조회
    const projects = await sql`
      SELECT id, project_number, project_name, construction_section, line_name, tower_configs
      FROM projects WHERE id = ${projectId}
    `;
    const project = projects[0];

    // 기존 유저 조회 또는 생성
    const existingUsers = await sql`
      SELECT id, name, affiliation FROM users
      WHERE name = ${name} AND affiliation = ${affiliation} AND project_id = ${project.id}
    `;

    let user;
    if (existingUsers.length > 0) {
      user = existingUsers[0];
    } else {
      const newUsers = await sql`
        INSERT INTO users (name, affiliation, project_id)
        VALUES (${name}, ${affiliation}, ${project.id})
        RETURNING id, name, affiliation
      `;
      user = newUsers[0];
    }

    return {
      success: true as const,
      user: { id: user.id, name: user.name, affiliation: user.affiliation },
      project: {
        id: project.id,
        projectNumber: project.project_number,
        projectName: project.project_name,
        constructionSection: project.construction_section || '',
        lineName: project.line_name || '',
        towerConfigs: project.tower_configs || [],
      },
    };
  } catch (e: any) {
    return { success: false as const, error: '로그인 중 오류가 발생했습니다.' };
  }
}

export async function getProjectSettings(projectId: string, userId: string) {
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    return null;
  }
  try {
    const result = await sql`
      SELECT project_name, construction_section, line_name, tower_configs
      FROM projects WHERE id = ${projectId}
    `;
    if (result.length === 0) return null;
    const p = result[0];
    return {
      projectName: p.project_name,
      constructionSection: p.construction_section || '',
      lineName: p.line_name || '',
      towerConfigs: p.tower_configs || [],
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function saveProjectSettings(
  projectId: string,
  userId: string,
  settings: { projectName: string; constructionSection: string; lineName: string },
  towerConfigs: any[],
) {
  // 해당 프로젝트 소속 유저만 설정 변경 가능
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    return { success: false, error: '접근 권한이 없습니다.' };
  }
  if (!settings.projectName || settings.projectName.length > 100) {
    return { success: false, error: '사업명을 올바르게 입력해주세요.' };
  }
  try {
    await sql`
      UPDATE projects SET
        project_name = ${settings.projectName},
        construction_section = ${settings.constructionSection},
        line_name = ${settings.lineName},
        tower_configs = ${JSON.stringify(towerConfigs)}::jsonb
      WHERE id = ${projectId}
    `;
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: '설정 저장에 실패했습니다.' };
  }
}

// ── Grounding actions ───────────────────────────────────────────

export async function uploadGrounding(data: {
  towerId: string;
  pointId: string;
  status: string;
  photoData: string;
  userId: string;
  projectId: string;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
}) {
  // userId가 해당 프로젝트 소속인지 검증
  try {
    await assertUserBelongsToProject(data.userId, data.projectId);
  } catch {
    return { success: false, error: '접근 권한이 없습니다.' };
  }
  // status 화이트리스트
  const allowedStatus = ['grounding', 'removed', 'exempt', 'none'];
  if (!allowedStatus.includes(data.status)) {
    return { success: false, error: '잘못된 상태값입니다.' };
  }
  // GPS 좌표 범위 검증 (없으면 null)
  const lat = typeof data.latitude === 'number' && Math.abs(data.latitude) <= 90 ? data.latitude : null;
  const lng = typeof data.longitude === 'number' && Math.abs(data.longitude) <= 180 ? data.longitude : null;
  const acc = typeof data.locationAccuracy === 'number' && data.locationAccuracy >= 0 && data.locationAccuracy < 1e7 ? data.locationAccuracy : null;
  try {
    const res = await sql`
      INSERT INTO grounding_logs
        (tower_id, point_id, status, photo_data, user_id, project_id, latitude, longitude, location_accuracy)
      VALUES
        (${data.towerId}, ${data.pointId}, ${data.status}, ${data.photoData}, ${data.userId}, ${data.projectId}, ${lat}, ${lng}, ${acc})
      RETURNING id
    `;
    return { success: true, logId: res[0].id };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: '업로드에 실패했습니다.' };
  }
}

/**
 * 각 접지점의 최신 상태만 가져옴. photo_data는 의도적으로 제외.
 * (페이로드 대폭 절감 — 기록보기 모달에서 필요할 때 getPointPhotoHistory로 지연 로드)
 */
export async function getLatestGrounding(t: number | undefined, projectId: string, userId: string) {
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    return [];
  }
  try {
    if (projectId) {
      const result = await sql`
        WITH LatestLogs AS (
          SELECT DISTINCT ON (tower_id, point_id)
            tower_id, point_id, status, user_id, created_at,
            latitude, longitude, location_accuracy,
            (photo_data IS NOT NULL) AS has_photo
          FROM grounding_logs
          WHERE project_id = ${projectId}
          ORDER BY tower_id, point_id, created_at DESC
        )
        SELECT l.*, u.name as user_name, u.affiliation
        FROM LatestLogs l
        LEFT JOIN users u ON l.user_id = u.id
      `;
      return result;
    }
    return [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getProjectPhotos(projectId: string, userId: string) {
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    return [];
  }
  try {
    const result = await sql`
      WITH AbsoluteLatest AS (
        SELECT DISTINCT ON (tower_id, point_id)
          tower_id, point_id, status, created_at, photo_data
        FROM grounding_logs
        WHERE project_id = ${projectId}
        ORDER BY tower_id, point_id, created_at DESC
      )
      SELECT tower_id, point_id, status, created_at, photo_data
      FROM AbsoluteLatest
      WHERE status IN ('grounding', 'removed') AND photo_data IS NOT NULL
      ORDER BY tower_id, point_id
    `;
    return result;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getProjectStatistics(projectId: string, userId: string) {
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    return null;
  }
  try {
    const dailyStats = await sql`
      SELECT 
        TO_CHAR(created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD') as date,
        COUNT(*) as count
      FROM grounding_logs
      WHERE project_id = ${projectId} AND status IN ('grounding', 'removed')
      GROUP BY date
      ORDER BY date ASC
    `;
    return {
      dailyStats
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

/**
 * 특정 접지점의 전체 히스토리를 photo_data와 함께 반환 (기록보기 모달 전용).
 */
export async function getPointPhotoHistory(
  towerId: string,
  pointId: string,
  projectId: string,
  userId: string,
) {
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    return [];
  }
  try {
    const result = await sql`
      SELECT l.status, l.photo_data, l.created_at,
             l.latitude, l.longitude, l.location_accuracy,
             u.name as user_name, u.affiliation
      FROM grounding_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.project_id = ${projectId}
        AND l.tower_id = ${towerId}
        AND l.point_id = ${pointId}
      ORDER BY l.created_at DESC
    `;
    return result;
  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * 철탑 1기의 모든 포인트에 대한 전체 작업 이력 (타임라인용, photo_data 제외).
 */
export async function getTowerHistory(towerId: string, projectId: string, userId: string) {
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    return [];
  }
  try {
    const result = await sql`
      SELECT l.point_id, l.status, l.created_at,
             l.latitude, l.longitude, l.location_accuracy,
             (l.photo_data IS NOT NULL) AS has_photo,
             u.name as user_name, u.affiliation
      FROM grounding_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.project_id = ${projectId}
        AND l.tower_id = ${towerId}
      ORDER BY l.created_at DESC
    `;
    return result;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function bulkToggleExempt(
  entries: { towerId: string; pointId: string }[],
  userId: string,
  isExempt: boolean,
  projectId: string,
) {
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    return { success: false, error: '접근 권한이 없습니다.' };
  }
  const status = isExempt ? 'exempt' : 'none';
  try {
    const results = await Promise.all(
      entries.map(e =>
        sql`INSERT INTO grounding_logs (tower_id, point_id, status, user_id, project_id)
            VALUES (${e.towerId}, ${e.pointId}, ${status}, ${userId}, ${projectId})
            RETURNING id`
      )
    );
    return { success: true, logIds: results.map(r => r[0].id) };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: '변경에 실패했습니다.' };
  }
}

export async function togglePointExempt(
  towerId: string,
  pointId: string,
  userId: string,
  isExempt: boolean,
  projectId: string,
) {
  // userId가 해당 프로젝트 소속인지 검증
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    return { success: false, error: '접근 권한이 없습니다.' };
  }
  try {
    const status = isExempt ? 'exempt' : 'none';
    const res = await sql`
      INSERT INTO grounding_logs (tower_id, point_id, status, user_id, project_id)
      VALUES (${towerId}, ${pointId}, ${status}, ${userId}, ${projectId})
      RETURNING id
    `;
    return { success: true, logId: res[0].id };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: '변경에 실패했습니다.' };
  }
}

// ── Registry actions ────────────────────────────────────────────

export async function uploadRegistry(title: string, fileData: string, userId: string, projectId: string) {
  // userId가 해당 프로젝트 소속인지 검증
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    return { success: false, error: '접근 권한이 없습니다.' };
  }
  if (!title || title.length > 200) {
    return { success: false, error: '제목을 올바르게 입력해주세요.' };
  }
  try {
    await sql`
      INSERT INTO registries (title, file_data, user_id, project_id)
      VALUES (${title}, ${fileData}, ${userId}, ${projectId})
    `;
    // revalidatePath 제거 (SPA)
    return { success: true };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: '업로드에 실패했습니다.' };
  }
}

export async function getRegistries(t: number | undefined, projectId: string, userId: string) {
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    return [];
  }
  try {
    if (projectId) {
      const result = await sql`
        SELECT r.id, r.title, r.user_id, r.created_at::text as created_at, u.name as user_name
        FROM registries r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.project_id = ${projectId}
        ORDER BY r.created_at DESC
      `;
      return result;
    }
    return [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getRegistryData(id: string, projectId: string, userId: string) {
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    return null;
  }
  try {
    // projectId 일치 여부 함께 검사 → 다른 프로젝트 데이터 접근 차단
    const result = await sql`
      SELECT file_data FROM registries WHERE id = ${id} AND project_id = ${projectId}
    `;
    return result[0]?.file_data ?? null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function deleteRegistry(id: string, projectId: string, userId: string) {
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    throw new Error('접근 권한이 없습니다.');
  }
  try {
    // projectId 일치 여부 함께 검사 → 다른 프로젝트 레코드 삭제 차단
    await sql`DELETE FROM registries WHERE id = ${id} AND project_id = ${projectId}`;
    revalidatePath('/');
  } catch (e: any) {
    throw new Error('삭제에 실패했습니다.');
  }
}

export async function deleteGroundingLog(towerId: string, pointId: string, projectId: string, userId: string) {
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    throw new Error('접근 권한이 없습니다.');
  }
  try {
    await sql`
      DELETE FROM grounding_logs
      WHERE id = (
        SELECT id FROM grounding_logs
        WHERE tower_id = ${towerId} AND point_id = ${pointId} AND project_id = ${projectId}
        ORDER BY created_at DESC
        LIMIT 1
      )
    `;
    revalidatePath('/');
  } catch {
    throw new Error('삭제에 실패했습니다.');
  }
}

export async function deleteGroundingLogById(logId: string, projectId: string, userId: string) {
  try {
    await assertUserBelongsToProject(userId, projectId);
  } catch {
    throw new Error('접근 권한이 없습니다.');
  }
  try {
    await sql`
      DELETE FROM grounding_logs
      WHERE id = ${logId} AND project_id = ${projectId}
    `;
    return { success: true };
  } catch (e: any) {
    console.error(e);
    throw new Error('삭제에 실패했습니다.');
  }
}
