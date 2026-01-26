"use server";

import { prisma } from "@/lib/prisma/client";
import { auth } from "@clerk/nextjs/server";
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
  subDays,
} from "date-fns";
import { ko } from "date-fns/locale";

/**
 * 대시보드 전체 통계 조회
 */
export async function getDashboardStats() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) return null;

  const userId = user.id;
  const now = new Date();
  const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 }); // 월요일 시작
  const endOfThisWeek = endOfWeek(now, { weekStartsOn: 1 });

  // 1. 이번 주 운동 횟수
  const weeklyWorkouts = await prisma.userCourseHistory.count({
    where: {
      userId,
      completedAt: {
        gte: startOfThisWeek,
        lte: endOfThisWeek,
      },
    },
  });

  // 2. 총 운동 시간 (CourseCompletionLog 활용하거나 CourseHistory에서 추정)
  // CourseCompletionLog가 아직 데이터가 적을 수 있으므로 CourseHistory와 Course 정보를 조인해서 계산
  const courseHistory = await prisma.userCourseHistory.findMany({
    where: { userId },
    include: {
      course: {
        select: { totalDurationMinutes: true },
      },
    },
  });

  const totalMinutes = courseHistory.reduce(
    (acc, curr) => acc + (curr.course.totalDurationMinutes || 0),
    0,
  );

  // 3. 누적 운동 횟수
  const totalWorkouts = courseHistory.length;

  // 4. 최근 통증 레벨 (가장 최근 기록)
  const lastPainLog = await prisma.userProgressLog.findFirst({
    where: { userId },
    orderBy: { recordedAt: "desc" },
    select: { painLevel: true, bodyPart: { select: { name: true } } },
  });

  return {
    weeklyWorkouts,
    totalMinutes,
    totalWorkouts,
    currentPainLevel: lastPainLog?.painLevel || null,
    lastPainBodyPart: lastPainLog?.bodyPart.name || null,
    userName: user.displayName || user.name || "사용자",
  };
}

/**
 * 주간 활동 내역 (최근 7일)
 */
export async function getWeeklyActivity() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return [];

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return [];

  const today = new Date();
  const weekAgo = subDays(today, 6);

  // 최근 7일간의 기록 조회
  const logs = await prisma.userCourseHistory.findMany({
    where: {
      userId: user.id,
      completedAt: {
        gte: weekAgo,
      },
    },
    select: {
      completedAt: true,
      course: {
        select: { totalDurationMinutes: true },
      },
    },
  });

  // 날짜별로 그룹화
  const activityMap = new Map<string, number>();

  // 초기화 (0분)
  const days = eachDayOfInterval({ start: weekAgo, end: today });
  days.forEach((day) => {
    activityMap.set(format(day, "yyyy-MM-dd"), 0);
  });

  // 데이터 채우기
  logs.forEach((log) => {
    if (!log.completedAt) return;
    const dateKey = format(log.completedAt, "yyyy-MM-dd");
    const current = activityMap.get(dateKey) || 0;
    activityMap.set(dateKey, current + (log.course.totalDurationMinutes || 0));
  });

  // 배열로 변환
  const result = days.map((day) => {
    const dateKey = format(day, "yyyy-MM-dd");
    return {
      date: format(day, "MM.dd", { locale: ko }), // "01.27" 형식
      fullDate: dateKey,
      dayName: format(day, "EEE", { locale: ko }), // "월", "화" 등
      minutes: activityMap.get(dateKey) || 0,
      count: logs.filter(
        (l) => l.completedAt && format(l.completedAt, "yyyy-MM-dd") === dateKey,
      ).length,
    };
  });

  return result;
}

/**
 * 통증 변화 추이 (최근 30일)
 */
export async function getPainTrend() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return [];

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return [];

  const thirtyDaysAgo = subDays(new Date(), 30);

  // 통증 로그 조회
  const painLogs = await prisma.userProgressLog.findMany({
    where: {
      userId: user.id,
      recordedAt: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: {
      recordedAt: "asc",
    },
    include: {
      bodyPart: {
        select: { name: true },
      },
    },
  });

  // 차트용 데이터 변환
  // 같은 날짜에 여러 기록이 있을 수 있으므로 날짜별 평균이나 대표값을 사용하는 것이 좋음
  // 여기서는 단순히 모든 기록을 나열하되, 날짜 포맷팅

  return painLogs.map((log) => ({
    date: format(log.recordedAt, "MM.dd"),
    fullDate: format(log.recordedAt, "yyyy-MM-dd HH:mm"),
    painLevel: log.painLevel,
    bodyPart: log.bodyPart.name,
  }));
}

/**
 * 최근 활동 내역 상세
 */
export async function getRecentHistory() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return [];

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return [];

  const history = await prisma.userCourseHistory.findMany({
    where: { userId: user.id },
    orderBy: { completedAt: "desc" },
    take: 5,
    include: {
      course: {
        include: {
          user: { select: { displayName: true } },
        },
      },
    },
  });

  return history.map((h) => ({
    id: h.id,
    courseTitle: h.course.isTemplate ? "맞춤형 재활 코스" : "자유 코스", // 코스 이름이 없어서 임시
    date: h.completedAt ? format(h.completedAt, "yyyy.MM.dd HH:mm") : "",
    duration: h.course.totalDurationMinutes,
    painLevel: h.course.painLevel,
    bodyParts: h.course.bodyParts,
  }));
}
