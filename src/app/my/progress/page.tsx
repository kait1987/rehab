'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, TrendingDown, TrendingUp, Activity, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface BodyPart {
  id: string;
  name: string;
}

interface ProgressLog {
  id: string;
  bodyPartId: string;
  bodyPartName: string;
  painLevel: number;
  rangeOfMotion: number | null;
  notes: string | null;
  recordedAt: string;
}

interface ChartDataPoint {
  date: string;
  painLevel: number;
  rangeOfMotion: number | null;
}

export default function MyProgressPage() {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [chartData, setChartData] = useState<Record<string, ChartDataPoint[]>>({});
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 입력 폼 상태
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [painLevel, setPainLevel] = useState(5);
  const [rangeOfMotion, setRangeOfMotion] = useState(70);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [progressRes, bodyPartRes] = await Promise.all([
        fetch('/api/users/progress'),
        fetch('/api/body-parts'),
      ]);

      if (progressRes.ok) {
        const data = await progressRes.json();
        setLogs(data.logs || []);
        setChartData(data.chartData || {});
      }

      if (bodyPartRes.ok) {
        const data = await bodyPartRes.json();
        setBodyParts(data.bodyParts || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedBodyPart) {
      toast.error('부위를 선택해주세요.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyPartId: selectedBodyPart,
          painLevel,
          rangeOfMotion,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '저장에 실패했습니다.');
      }

      toast.success(data.message);
      fetchData(); // 새로고침

      // 입력 초기화
      setSelectedBodyPart('');
      setPainLevel(5);
      setRangeOfMotion(70);
      setNotes('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  // 변화 분석
  function analyzeChange(partName: string): { painTrend: 'up' | 'down' | 'stable'; message: string } {
    const data = chartData[partName];
    if (!data || data.length < 2) {
      return { painTrend: 'stable', message: '데이터가 부족합니다' };
    }

    const recent = data.slice(-3);
    const avgRecent = recent.reduce((sum, d) => sum + d.painLevel, 0) / recent.length;
    const older = data.slice(0, Math.min(3, data.length - 3));
    const avgOlder = older.reduce((sum, d) => sum + d.painLevel, 0) / older.length;

    const diff = avgRecent - avgOlder;
    if (diff < -0.5) {
      return { painTrend: 'down', message: `통증 ${Math.abs(diff).toFixed(1)} 감소 📉` };
    } else if (diff > 0.5) {
      return { painTrend: 'up', message: `통증 ${diff.toFixed(1)} 증가 📈` };
    }
    return { painTrend: 'stable', message: '변화 없음' };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">진행 상황 추적</h1>

      {/* 변화 요약 */}
      {Object.keys(chartData).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(chartData).slice(0, 4).map((partName) => {
            const analysis = analyzeChange(partName);
            return (
              <Card key={partName}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {analysis.painTrend === 'down' && <TrendingDown className="w-4 h-4 text-green-500" />}
                    {analysis.painTrend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                    {analysis.painTrend === 'stable' && <Activity className="w-4 h-4 text-gray-500" />}
                    {partName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{analysis.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    최근 기록: {chartData[partName].length}개
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 기록 추가 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            오늘의 상태 기록
          </CardTitle>
          <CardDescription>
            현재 통증과 가동범위를 기록하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 부위 선택 */}
          <div className="space-y-2">
            <Label>부위 *</Label>
            <Select value={selectedBodyPart} onValueChange={setSelectedBodyPart}>
              <SelectTrigger>
                <SelectValue placeholder="부위를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {bodyParts.map((bp) => (
                  <SelectItem key={bp.id} value={bp.id}>
                    {bp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 통증 레벨 */}
          <div className="space-y-2">
            <Label>통증 레벨: {painLevel}/10</Label>
            <Slider
              value={[painLevel]}
              onValueChange={(v) => setPainLevel(v[0])}
              min={1}
              max={10}
              step={1}
            />
            <p className="text-xs text-muted-foreground">1: 거의 없음 ~ 10: 극심함</p>
          </div>

          {/* 가동범위 */}
          <div className="space-y-2">
            <Label>가동범위: {rangeOfMotion}%</Label>
            <Slider
              value={[rangeOfMotion]}
              onValueChange={(v) => setRangeOfMotion(v[0])}
              min={0}
              max={100}
              step={5}
            />
            <p className="text-xs text-muted-foreground">0%: 거의 움직임 없음 ~ 100%: 완전 정상</p>
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label>메모 (선택)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="오늘의 특이사항을 기록하세요"
              rows={2}
            />
          </div>

          <Button onClick={handleSave} disabled={saving || !selectedBodyPart} className="w-full">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            기록하기
          </Button>
        </CardContent>
      </Card>

      {/* 최근 기록 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 기록</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              아직 기록이 없습니다. 첫 번째 기록을 추가해보세요!
            </p>
          ) : (
            <div className="space-y-3">
              {logs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{log.bodyPartName}</p>
                    <p className="text-sm text-muted-foreground">
                      통증 {log.painLevel}/10
                      {log.rangeOfMotion !== null && ` · 가동범위 ${log.rangeOfMotion}%`}
                    </p>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.recordedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
