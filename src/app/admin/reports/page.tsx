'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, X, Loader2 } from 'lucide-react';

interface GymReport {
  id: string;
  reportType: string;
  fieldName: string | null;
  currentValue: string | null;
  suggestedValue: string | null;
  description: string | null;
  status: string;
  createdAt: string;
  gym: { id: string; name: string; address: string };
  user: { id: string; email: string; displayName: string | null } | null;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  info_wrong: '정보 오류',
  hours_changed: '운영시간 변경',
  closed: '폐업',
  moved: '이전',
  other: '기타',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

function AdminReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<GymReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const status = searchParams.get('status') || 'pending';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${status}&page=${page}&limit=20`);
      const data = await res.json();
      if (res.ok) {
        setReports(data.data);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || '제보 목록을 불러오는데 실패했습니다.');
      }
    } catch {
      toast.error('제보 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [status, page]);

  const handleAction = async (reportId: string, action: 'approve' | 'reject') => {
    setProcessingId(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchReports();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('처리에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    router.push(`/admin/reports?status=${newStatus}&page=1`);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">제보 관리</h1>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">대기중</SelectItem>
            <SelectItem value="approved">승인됨</SelectItem>
            <SelectItem value="rejected">거절됨</SelectItem>
            <SelectItem value="all">전체</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          제보가 없습니다.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>헬스장</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>내용</TableHead>
              <TableHead>제보자</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>날짜</TableHead>
              <TableHead>액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">{report.gym.name}</TableCell>
                <TableCell>{REPORT_TYPE_LABELS[report.reportType] || report.reportType}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {report.suggestedValue || report.description || '-'}
                </TableCell>
                <TableCell>{report.user?.email || '익명'}</TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[report.status]}>
                    {report.status === 'pending' ? '대기' : report.status === 'approved' ? '승인' : '거절'}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(report.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                <TableCell>
                  {report.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600"
                        onClick={() => handleAction(report.id, 'approve')}
                        disabled={processingId === report.id}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => handleAction(report.id, 'reject')}
                        disabled={processingId === report.id}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => router.push(`/admin/reports?status=${status}&page=${page - 1}`)}
          >
            이전
          </Button>
          <span className="py-2 px-4">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= pagination.totalPages}
            onClick={() => router.push(`/admin/reports?status=${status}&page=${page + 1}`)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AdminReportsContent />
    </Suspense>
  );
}
