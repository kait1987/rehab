/**
 * Prisma Client 초기화 (Prisma 7 방식)
 * 
 * Prisma 7에서는 adapter를 사용하여 데이터베이스 연결을 설정합니다.
 * 싱글톤 패턴으로 안정적인 연결 관리를 보장합니다.
 * 
 * 맥과 Windows 모두에서 동일하게 작동하도록 설계되었습니다.
 * 
 * @example
 * ```ts
 * import { prisma } from '@/lib/prisma/client';
 * 
 * const users = await prisma.user.findMany();
 * ```
 */

import { PrismaClient } from '@/app/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

// 환경변수에서 DATABASE_URL 가져오기
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Please check your .env file.'
  )
}

// Prisma Postgres Adapter 생성
const adapter = new PrismaPg({
  connectionString: databaseUrl,
})

// PrismaClient 인스턴스 생성 (싱글톤 패턴)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

// 개발 환경에서만 전역 변수로 저장 (Hot Reload 대응)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 연결 종료 함수 (애플리케이션 종료 시 사용)
export async function disconnectPrisma() {
  await prisma.$disconnect()
}

