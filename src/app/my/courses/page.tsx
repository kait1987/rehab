"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Dumbbell, ArrowLeft, Calendar, Loader2 } from "lucide-react";

interface SavedCourse {
  id: string;
  totalDurationMinutes: number;
  painLevel: number | null;
  experienceLevel: string | null;
  bodyParts: string[];
  equipmentAvailable: string[];
  courseType: string;
  createdAt: string;
  exercises: Array<{
    id: string;
    section: string;
    orderInSection: number;
    exercise: {
      id: string;
      name: string;
      description: string | null;
    };
  }>;
}

export default function MyCoursesPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<SavedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (isSignedIn) {
      fetchCourses();
    }
  }, [isLoaded, isSignedIn, router]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/courses");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "코스 목록을 불러오는데 실패했습니다.");
      }

      setCourses(data.data.courses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSectionCount = (exercises: SavedCourse["exercises"], section: string) => {
    return exercises.filter((e) => e.section === section).length;
  };

  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">내 재활 코스</h1>
            <p className="text-muted-foreground">
              저장된 맞춤 재활 코스를 확인하세요
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="p-6 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchCourses} variant="outline">
                다시 시도
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && courses.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">저장된 코스가 없습니다</h3>
              <p className="text-muted-foreground mb-6">
                재활 코스를 생성하고 저장해보세요!
              </p>
              <Button onClick={() => router.push("/rehab")}>
                코스 생성하기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Course List */}
        {!loading && !error && courses.length > 0 && (
          <div className="space-y-4">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {course.bodyParts.join(" · ")} 재활 코스
                    </CardTitle>
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      {course.totalDurationMinutes}분
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(course.createdAt)}
                    </div>
                    <span>|</span>
                    <span>통증 {course.painLevel}/5</span>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-4">
                    <Badge variant="outline">
                      준비 {getSectionCount(course.exercises, "warmup")}
                    </Badge>
                    <Badge variant="outline">
                      메인 {getSectionCount(course.exercises, "main")}
                    </Badge>
                    <Badge variant="outline">
                      마무리 {getSectionCount(course.exercises, "cooldown")}
                    </Badge>
                  </div>

                  <div className="flex gap-1 flex-wrap">
                    {course.equipmentAvailable.map((eq) => (
                      <Badge key={eq} variant="secondary" className="text-xs">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
