'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';

/**
 * Admin Templates List Page
 * 운동 템플릿 목록/검색/페이지네이션
 */

interface Template {
  id: string;
  name: string;
  description: string | null;
  bodyPart: { name: string };
  intensityLevel: number | null;
  isActive: boolean;
}

interface TemplatesResponse {
  templates: Template[];
  total: number;
  page: number;
  totalPages: number;
}

// Suspense fallback
function TemplatesLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}

// Main component that uses useSearchParams
function TemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';

  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ 
          page: page.toString(), 
          limit: '20',
          ...(search && { search })
        });
        const res = await fetch(`/api/admin/templates?${params}`);
        if (!res.ok) throw new Error('Failed to fetch templates');
        const data: TemplatesResponse = await res.json();
        setTemplates(data.templates);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput) params.set('search', searchInput);
    params.set('page', '1');
    router.push(`/admin/templates?${params}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/admin/templates?${params}`);
  };

  const getIntensityBadge = (level: number | null) => {
    if (!level) return <Badge variant="outline">미설정</Badge>;
    if (level <= 2) return <Badge className="bg-green-500">쉬움</Badge>;
    if (level <= 3) return <Badge className="bg-yellow-500">보통</Badge>;
    return <Badge className="bg-red-500">어려움</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          템플릿 추가
        </Button>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="템플릿 이름으로 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">검색</Button>
          </form>
        </CardContent>
      </Card>

      {/* 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            총 {total}개 템플릿
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <p className="text-red-500">오류: {error}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>부위</TableHead>
                    <TableHead>강도</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.bodyPart?.name || '-'}</TableCell>
                      <TableCell>{getIntensityBadge(template.intensityLevel)}</TableCell>
                      <TableCell>
                        {template.isActive ? (
                          <Badge>활성</Badge>
                        ) : (
                          <Badge variant="secondary">비활성</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Export with Suspense wrapper
export default function AdminTemplatesPage() {
  return (
    <Suspense fallback={<TemplatesLoading />}>
      <TemplatesContent />
    </Suspense>
  );
}

