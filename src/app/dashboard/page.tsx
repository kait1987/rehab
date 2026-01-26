import {
  getDashboardStats,
  getPainTrend,
  getRecentHistory,
  getWeeklyActivity,
} from "@/actions/dashboard-actions";
import {
  PainTrendChart,
  WeeklyActivityChart,
} from "@/components/dashboard/charts";
import { RecentHistoryList } from "@/components/dashboard/recent-history";
import { StatCards } from "@/components/dashboard/stat-cards";
import { redirect } from "next/navigation";

export const metadata = {
  title: "대시보드 | REHAB",
  description: "나의 재활 진행 상황과 운동 기록을 확인하세요.",
};

export default async function DashboardPage() {
  // 병렬 데이터 페칭을 위해 Promise.all 사용
  const [stats, weeklyData, painTrend, history] = await Promise.all([
    getDashboardStats(),
    getWeeklyActivity(),
    getPainTrend(),
    getRecentHistory(),
  ]);

  if (!stats) {
    redirect("/sign-in");
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
      {/* 헤더 영역 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          반가워요, {stats.userName}님! 👋
        </h1>
        <p className="text-muted-foreground">
          오늘도 꾸준한 재활로 더 건강한 하루를 만들어보세요.
        </p>
      </div>

      {/* 핵심 지표 카드 */}
      <StatCards stats={stats} />

      {/* 차트 영역 (반응형 그리드) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-4">
          <WeeklyActivityChart data={weeklyData} />
        </div>
        <div className="col-span-4 lg:col-span-3">
          <RecentHistoryList history={history} />
        </div>
      </div>

      {/* 통증 추이 차트 (전체 너비) */}
      <div className="grid gap-4 md:grid-cols-1">
        <PainTrendChart data={painTrend} />
      </div>
    </main>
  );
}
