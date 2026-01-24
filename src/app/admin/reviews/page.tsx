"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, EyeOff, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Admin Reviews Management Page
 * 리뷰 목록/필터/액션(숨김/삭제/승인)
 */

interface Review {
  id: string;
  comment: string | null;
  isDeleted: boolean;
  isAdminReview: boolean;
  createdAt: string;
  gym: { name: string };
  user: { email: string | null } | null;
  reviewTagMappings: { reviewTag: { name: string } }[];
}

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "deleted" | "active">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ filter });
        const res = await fetch(`/api/admin/reviews?${params}`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data: ReviewsResponse = await res.json();
        setReviews(data.reviews);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [filter]);

  const handleAction = async (
    id: string,
    action: "hide" | "delete" | "approve",
  ) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) throw new Error("Action failed");

      // 목록 새로고침
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, isDeleted: action === "hide" || action === "delete" }
            : r,
        ),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reviews</h1>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">필터:</span>
            <Select
              value={filter}
              onValueChange={(v: typeof filter) => setFilter(v)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="deleted">삭제됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 리뷰 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            총 {total}개 리뷰
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-500">오류: {error}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>헬스장</TableHead>
                  <TableHead>태그</TableHead>
                  <TableHead>코멘트</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">
                      {review.gym?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {review.reviewTagMappings.slice(0, 3).map((m, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {m.reviewTag.name}
                          </Badge>
                        ))}
                        {review.reviewTagMappings.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{review.reviewTagMappings.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {review.comment || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {review.user?.email || "익명"}
                    </TableCell>
                    <TableCell>
                      {review.isDeleted ? (
                        <Badge variant="destructive">삭제됨</Badge>
                      ) : review.isAdminReview ? (
                        <Badge>관리자</Badge>
                      ) : (
                        <Badge variant="secondary">활성</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {review.isDeleted ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(review.id, "approve")}
                            disabled={actionLoading === review.id}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(review.id, "hide")}
                              disabled={actionLoading === review.id}
                            >
                              <EyeOff className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(review.id, "delete")}
                              disabled={actionLoading === review.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
