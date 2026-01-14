"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Calendar, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useRecentCourses,
  type LocalRecentCourse,
} from "@/hooks/use-recent-courses";
import { toast } from "sonner";

export default function MyPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const { recentCourses, removeCourse } = useRecentCourses();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteCourse = async (courseId: string) => {
    const confirmed = window.confirm(
      "이 코스를 삭제하시겠습니까? 삭제된 코스는 복구할 수 없습니다.",
    );
    if (!confirmed) return;

    setDeletingId(courseId);

    // UUID 형식인지 확인 (DB 코스 vs localStorage 코스)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        courseId,
      );

    try {
      // 로그인 사용자이고 UUID 형식인 경우에만 DB 삭제 시도
      if (isSignedIn && isUUID) {
        try {
          const response = await fetch(`/api/courses/${courseId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const data = await response.json();
            // 404는 DB에 없는 코스 - 로컬만 삭제하면 됨
            if (response.status !== 404) {
              throw new Error(data.error || "코스 삭제에 실패했습니다.");
            }
            console.log(
              "[MyPage] Course not found in DB, deleting from local only",
            );
          } else {
            console.log("[MyPage] Course deleted from DB:", courseId);
          }
        } catch (apiError) {
          // API 에러 시에도 로컬 삭제는 진행
          console.warn(
            "[MyPage] API delete failed, proceeding with local delete:",
            apiError,
          );
        }
      }

      // 로컬 스토리지에서 삭제
      const success = removeCourse(courseId);
      if (success) {
        toast.success("코스가 삭제되었습니다.");
        console.log("[MyPage] Course deleted from localStorage:", courseId);
      } else {
        throw new Error("코스 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("[MyPage] Delete course error:", error);
      toast.error(
        error instanceof Error ? error.message : "코스 삭제에 실패했습니다.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleCourseClick = (course: LocalRecentCourse) => {
    if (!course.requestData) {
      // 🆕 이전 데이터는 홈으로 이동하여 다시 선택하도록 유도 (Fallback)
      const params = new URLSearchParams();
      params.set("restart", "true");
      if (course.bodyParts) {
        params.set("bodyParts", course.bodyParts.join(","));
      }
      if (course.painLevel) {
        params.set("painLevel", course.painLevel.toString());
      }

      toast.info("이전 코스 데이터를 불러옵니다. 설정을 확인해주세요.");
      router.push(`/?${params.toString()}`);
      return;
    }

    const encoded = encodeURIComponent(JSON.stringify(course.requestData));
    router.push(`/rehab?data=${encoded}`);
  };

  if (!isLoaded) {
    return (
      <main className="min-h-[calc(100vh-80px)] container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 뒤로가기 */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" strokeWidth={1.5} />
          뒤로가기
        </Button>

        {/* 프로필 카드 - 로그인 시에만 표시 */}
        {isSignedIn && user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" strokeWidth={1.5} />내 프로필
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
                    <User
                      className="w-10 h-10 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold">
                    {user.fullName || "사용자"}
                  </h2>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Mail className="w-4 h-4" strokeWidth={1.5} />
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4" strokeWidth={1.5} />
                    가입일:{" "}
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("ko-KR")
                      : "알 수 없음"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 비로그인 안내 */}
        {!isSignedIn && (
          <Card>
            <CardContent className="py-6">
              <p className="text-muted-foreground text-center">
                로그인하시면 더 많은 기능을 이용할 수 있습니다.
              </p>
              <div className="flex justify-center mt-4">
                <Button onClick={() => router.push("/sign-in")}>
                  로그인하기
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 저장된 코스 바로가기 */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-semibold text-lg mb-1">저장된 코스 보기</h3>
              <p className="text-sm text-muted-foreground">
                저장한 재활 코스 목록을 확인하세요
              </p>
            </div>
            <Button onClick={() => router.push("/my/courses")}>보러가기</Button>
          </CardContent>
        </Card>

        {/* 최근 코스 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 생성한 코스</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCourses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                아직 생성한 코스가 없습니다.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentCourses.slice(0, 5).map((course) => (
                  <li
                    key={course.id}
                    className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleCourseClick(course)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium">
                          {course.bodyParts.join(", ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {course.totalDuration}분 | 운동 {course.exerciseCount}
                          개
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(course.createdAt).toLocaleDateString(
                            "ko-KR",
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation(); // 부모 li의 클릭 이벤트 전파 방지
                            handleDeleteCourse(course.id);
                          }}
                          disabled={deletingId === course.id}
                        >
                          {deletingId === course.id ? (
                            <Loader2
                              className="w-4 h-4 animate-spin"
                              strokeWidth={1.5}
                            />
                          ) : (
                            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                          )}
                        </Button>
                      </div>
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
