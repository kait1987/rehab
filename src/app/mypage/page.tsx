"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Calendar, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRecentCourses } from "@/hooks/use-recent-courses";

export default function MyPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { courses } = useRecentCourses();

  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-80px)] container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-80px)] container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 뒤로가기 */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={1.5} />
          뒤로가기
        </Button>

        {/* 프로필 카드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" strokeWidth={1.5} />
              내 프로필
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="프로필"
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">
                  {user.fullName || '사용자'}
                </h2>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Mail className="w-4 h-4" strokeWidth={1.5} />
                  {user.primaryEmailAddress?.emailAddress}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" strokeWidth={1.5} />
                  가입일: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '알 수 없음'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 최근 코스 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 생성한 코스</CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                아직 생성한 코스가 없습니다.
              </p>
            ) : (
              <ul className="space-y-3">
                {courses.slice(0, 5).map((course, index) => (
                  <li key={index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{course.bodyParts.join(', ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {course.totalDuration}분 | 운동 {course.exerciseCount}개
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(course.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
