import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Timer } from "lucide-react";

interface HistoryItem {
  id: string;
  courseTitle: string;
  date: string;
  duration: number | null;
  painLevel: number | null;
  bodyParts: string[];
}

export function RecentHistoryList({ history }: { history: HistoryItem[] }) {
  if (history.length === 0) {
    return (
      <Card className="col-span-1 border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base font-medium">최근 활동</CardTitle>
          <CardDescription>아직 운동 기록이 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          첫 운동을 시작해보세요!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="text-base font-medium">최근 활동</CardTitle>
        <CardDescription>최근 완료한 5개의 운동</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/50 hover:bg-accent/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">
                    {item.courseTitle}
                  </span>
                  <div className="flex gap-1">
                    {item.bodyParts.slice(0, 2).map((bp, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-[10px] h-5 px-1.5"
                      >
                        {bp}
                      </Badge>
                    ))}
                    {item.bodyParts.length > 2 && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 px-1.5"
                      >
                        +{item.bodyParts.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-xs text-muted-foreground gap-3">
                  <span className="flex items-center gap-1">{item.date}</span>
                  <span className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {item.duration || 0}분
                  </span>
                </div>
              </div>

              {/* 통증 레벨 표시 (있을 경우) */}
              {item.painLevel !== null && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-0.5">
                    통증
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      item.painLevel <= 3
                        ? "text-green-500"
                        : item.painLevel <= 6
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  >
                    Lv.{item.painLevel}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
