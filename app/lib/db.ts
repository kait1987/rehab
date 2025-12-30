import { PrismaClient } from "../generated/prisma";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// DB 연결 선을 하나만 만들어서 계속 재사용하는 코드입니다.
export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"], // 터미널에 실행되는 SQL 명령어들을 보여줍니다.
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
