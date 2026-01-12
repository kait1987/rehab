'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Activity, TrendingUp, Loader2 } from 'lucide-react';

/**
 * User Exercise History Page
 * 주간 히스토리/부위별 빈도 표시
 */

interface CourseHistory {
  id: string;
  completedAt: string;
  totalDuration: number;
  course: {
    bodyParts: string[];
  };
}

interface HistoryStats {
  totalSessions: number;
  thisWeekSessions: number;
  byBodyPart: Record<string, number>;
}

interface HistoryResponse {
  courses: CourseHistory[];
  stats: HistoryStats;
}

export default function MyHistoryPage() {
  const [courses, setCourses] = useState<CourseHistory[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/users/history');
        if (!res.ok) throw new Error('Failed to fetch history');
        const data: HistoryResponse = await res.json();
        setCourses(data.courses || []);
        setStats(data.stats || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <p className="text-red-600">오류: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">운동 기록</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              이번 주
            </CardTitle>
            <Calendar className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.thisWeekSessions || 0}회</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 운동
            </CardTitle>
            <Activity className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalSessions || 0}회</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              주요 부위
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {stats?.byBodyPart && Object.entries(stats.byBodyPart)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([part, count]) => (
                  <Badge key={part} variant="outline">
                    {part} ({count})
                  </Badge>
                ))
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 운동 기록 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 운동</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              아직 운동 기록이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(course.completedAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {course.totalDuration}분 운동
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {course.course?.bodyParts?.slice(0, 2).map((part, i) => (
                      <Badge key={i} variant="secondary">{part}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
