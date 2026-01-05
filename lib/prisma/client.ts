import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
    // 💡 datasources 옵션이 없으므로, Prisma는 알아서 .env를 읽습니다. (하드코딩 제거됨)
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
