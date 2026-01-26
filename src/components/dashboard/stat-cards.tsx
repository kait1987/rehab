import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, Minus, TrendingDown, TrendingUp } from "lucide-react";

interface DashboardStats {
  weeklyWorkouts: number;
  totalMinutes: number;
  totalWorkouts: number;
  currentPainLevel: number | null;
  lastPainBodyPart: string | null;
}

export function StatCards({ stats }: { stats: DashboardStats }) {
  // 통증 상태에 따른 아이콘 및 색상 결정
  const getPainStatus = (level: number | null) => {
    if (level === null)
      return { icon: Minus, color: "text-muted-foreground", text: "기록 없음" };
    if (level <= 3)
      return { icon: TrendingDown, color: "text-green-500", text: "양호함" };
    if (level <= 6)
      return { icon: Minus, color: "text-yellow-500", text: "보통" };
    return { icon: TrendingUp, color: "text-red-500", text: "주의 필요" };
  };

  const painStatus = getPainStatus(stats.currentPainLevel);
  const PainIcon = painStatus.icon;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">이번 주 운동</CardTitle>
          <Activity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.weeklyWorkouts}회</div>
          <p className="text-xs text-muted-foreground">
            누적 {stats.totalWorkouts}회 완료
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 운동 시간</CardTitle>
          <Clock className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMinutes}분</div>
          <p className="text-xs text-muted-foreground">
            평균{" "}
            {stats.totalWorkouts > 0
              ? Math.round(stats.totalMinutes / stats.totalWorkouts)
              : 0}
            분 / 회
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            현재 상태 ({stats.lastPainBodyPart || "기록 없음"})
          </CardTitle>
          <PainIcon className={`h-4 w-4 ${painStatus.color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-2">
            {stats.currentPainLevel !== null
              ? `Lv.${stats.currentPainLevel}`
              : "-"}
            <span className={`text-sm font-normal ${painStatus.color}`}>
              {painStatus.text}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">최근 통증 기록 기준</p>
        </CardContent>
      </Card>
    </div>
  );
}
