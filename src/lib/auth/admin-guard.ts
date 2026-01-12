/**
 * Admin Guard Utility
 * 
 * 관리자 권한이 필요한 API에서 사용하는 가드 함수입니다.
 * SSOT는 Clerk publicMetadata.role입니다.
 */

import { auth } from '@clerk/nextjs/server';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized: Admin access required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 관리자 권한을 확인하고, 없으면 에러를 던집니다.
 * 
 * @throws {UnauthorizedError} 관리자가 아닌 경우
 * @returns {Promise<{ userId: string; role: string }>} 인증된 관리자 정보
 * 
 * @example
 * ```typescript
 * export async function GET() {
 *   const { userId } = await requireAdmin();
 *   // 관리자 전용 로직...
 * }
 * ```
 */
export async function requireAdmin(): Promise<{ userId: string; role: string }> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    throw new UnauthorizedError('Unauthorized: Not authenticated');
  }

  const role = (sessionClaims?.publicMetadata as { role?: string })?.role;

  if (role !== 'admin') {
    throw new UnauthorizedError('Unauthorized: Admin access required');
  }

  return { userId, role };
}

/**
 * 관리자 여부만 확인합니다 (에러를 던지지 않음).
 * 
 * @returns {Promise<boolean>} 관리자이면 true
 */
export async function isAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
