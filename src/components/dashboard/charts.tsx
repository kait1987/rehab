"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeeklyActivityProps {
  data: {
    date: string;
    dayName: string;
    minutes: number;
    count: number;
  }[];
}

export function WeeklyActivityChart({ data }: WeeklyActivityProps) {
  return (
    <Card className="col-span-1 border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="text-base font-medium">주간 활동</CardTitle>
        <CardDescription>최근 7일간의 운동 시간</CardDescription>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="dayName"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                unit="분"
                width={40}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--accent))", opacity: 0.2 }}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(value: number) => [`${value}분`, "운동 시간"]}
              />
              <Bar
                dataKey="minutes"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface PainTrendProps {
  data: {
    date: string;
    painLevel: number;
    bodyPart: string;
  }[];
}

export function PainTrendChart({ data }: PainTrendProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="col-span-1 border-border/50 bg-card/50 flex flex-col justify-center items-center h-[350px]">
        <div className="text-muted-foreground text-sm">
          기록된 통증 데이터가 없습니다.
        </div>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="text-base font-medium">통증 변화 추이</CardTitle>
        <CardDescription>낮을수록 좋습니다 (1-10)</CardDescription>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--destructive))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--destructive))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                domain={[0, 10]}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value}점 (${props.payload.bodyPart})`,
                  "통증 레벨",
                ]}
              />
              <Area
                type="monotone"
                dataKey="painLevel"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#painGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
