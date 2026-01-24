"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Activity,
  Dumbbell,
  LayoutGrid,
  Download,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

/**
 * Admin Dashboard - Phase 4 Enhanced
 * 통계 카드 + 차트 + 인기 운동 + CSV 내보내기
 */

interface SummaryStats {
  totalUsers: number;
  totalExercises: number;
  totalCourses: number;
  totalBodyParts: number;
  totalEquipment: number;
  recentCourses: number;
}

interface TrendData {
  date: string;
  count: number;
}

interface PopularExercise {
  id: string;
  name: string;
  bodyPart: string;
  count: number;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [popular, setPopular] = useState<PopularExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchAllStats() {
      try {
        const [summaryRes, trendsRes, popularRes] = await Promise.all([
          fetch("/api/admin/stats?type=summary"),
          fetch("/api/admin/stats?type=trends"),
          fetch("/api/admin/stats?type=popular"),
        ]);

        if (!summaryRes.ok || !trendsRes.ok || !popularRes.ok) {
          throw new Error("Failed to fetch stats");
        }

        const summaryData = await summaryRes.json();
        const trendsData = await trendsRes.json();
        const popularData = await popularRes.json();

        setSummary(summaryData.summary);
        setTrends(trendsData.trends);
        setPopular(popularData.popular);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchAllStats();
  }, []);

  // CSV 내보내기
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Fetch all exercises
      const res = await fetch("/api/admin/templates?limit=1000");
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();

      // Convert to CSV
      const headers = ["ID", "Name", "Body Part", "Intensity", "Active"];
      const rows = data.templates.map((t: any) => [
        t.id,
        t.name,
        t.bodyPart?.name || "",
        t.intensityLevel || "",
        t.isActive ? "Yes" : "No",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row: string[]) =>
          row.map((cell) => `"${cell}"`).join(","),
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `exercises_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
    } catch (err) {
      alert("CSV 내보내기에 실패했습니다.");
    } finally {
      setExporting(false);
    }
  };

  const statCards = [
    {
      title: "총 사용자",
      value: summary?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "총 코스",
      value: summary?.totalCourses ?? 0,
      icon: Activity,
      color: "text-green-600",
    },
    {
      title: "운동 템플릿",
      value: summary?.totalExercises ?? 0,
      icon: Dumbbell,
      color: "text-purple-600",
    },
    {
      title: "최근 7일 코스",
      value: summary?.recentCourses ?? 0,
      icon: LayoutGrid,
      color: "text-orange-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="pt-6">
          <p className="text-red-600">오류: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={handleExportCSV} disabled={exporting}>
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          CSV 내보내기
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {card.value.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">코스 생성 추이 (30일)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.slice(5)} // MM-DD
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(value) => `날짜: ${value}`}
                    formatter={(value: number) => [`${value}건`, "생성"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Popular Exercises Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">인기 운동 TOP 10</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popular} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}회`, "사용"]}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Exercises Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">인기 운동 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">순위</th>
                  <th className="text-left py-2 px-4">운동 이름</th>
                  <th className="text-left py-2 px-4">부위</th>
                  <th className="text-right py-2 px-4">사용 횟수</th>
                </tr>
              </thead>
              <tbody>
                {popular.map((exercise, index) => (
                  <tr key={exercise.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-4 font-medium">{index + 1}</td>
                    <td className="py-2 px-4">{exercise.name}</td>
                    <td className="py-2 px-4 text-muted-foreground">
                      {exercise.bodyPart}
                    </td>
                    <td className="py-2 px-4 text-right font-medium">
                      {exercise.count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
