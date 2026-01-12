'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

/**
 * Template Edit/Create Page
 * 템플릿 생성/수정 폼
 */

interface BodyPart {
  id: string;
  name: string;
}

interface TemplateFormData {
  name: string;
  description: string;
  bodyPartId: string;
  intensityLevel: number;
  durationMinutes: number;
  reps: number;
  sets: number;
  restSeconds: number;
  instructions: string;
  precautions: string;
  isActive: boolean;
}

export default function TemplateEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const templateId = isNew ? null : params.id as string;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  
  const [form, setForm] = useState<TemplateFormData>({
    name: '',
    description: '',
    bodyPartId: '',
    intensityLevel: 2,
    durationMinutes: 5,
    reps: 10,
    sets: 3,
    restSeconds: 30,
    instructions: '',
    precautions: '',
    isActive: true,
  });

  // 부위 목록 로드
  useEffect(() => {
    async function fetchBodyParts() {
      try {
        const res = await fetch('/api/pain-check-data');
        const data = await res.json();
        setBodyParts(data.data?.bodyParts || []);
      } catch (err) {
        console.error('Failed to fetch body parts:', err);
      }
    }
    fetchBodyParts();
  }, []);

  // 기존 템플릿 데이터 로드
  useEffect(() => {
    if (!templateId) return;
    
    async function fetchTemplate() {
      try {
        const res = await fetch(`/api/admin/templates/${templateId}`);
        if (!res.ok) throw new Error('Failed to fetch template');
        const data = await res.json();
        setForm({
          name: data.name || '',
          description: data.description || '',
          bodyPartId: data.bodyPartId || '',
          intensityLevel: data.intensityLevel || 2,
          durationMinutes: data.durationMinutes || 5,
          reps: data.reps || 10,
          sets: data.sets || 3,
          restSeconds: data.restSeconds || 30,
          instructions: data.instructions || '',
          precautions: data.precautions || '',
          isActive: data.isActive ?? true,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchTemplate();
  }, [templateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.bodyPartId) {
      setError('이름과 부위는 필수입니다.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = templateId 
        ? `/api/admin/templates/${templateId}` 
        : '/api/admin/templates';
      const method = templateId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save template');
      }

      router.push('/admin/templates');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isNew ? '템플릿 추가' : '템플릿 수정'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="운동 이름"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyPart">부위 *</Label>
                <Select 
                  value={form.bodyPartId} 
                  onValueChange={(v) => setForm({ ...form, bodyPartId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="부위 선택" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="운동 설명"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="intensity">강도 (1-5)</Label>
                <Input
                  id="intensity"
                  type="number"
                  min={1}
                  max={5}
                  value={form.intensityLevel}
                  onChange={(e) => setForm({ ...form, intensityLevel: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">시간 (분)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reps">반복</Label>
                <Input
                  id="reps"
                  type="number"
                  min={1}
                  value={form.reps}
                  onChange={(e) => setForm({ ...form, reps: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sets">세트</Label>
                <Input
                  id="sets"
                  type="number"
                  min={1}
                  value={form.sets}
                  onChange={(e) => setForm({ ...form, sets: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">수행 방법</Label>
              <Textarea
                id="instructions"
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="운동 수행 방법"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precautions">주의사항</Label>
              <Textarea
                id="precautions"
                value={form.precautions}
                onChange={(e) => setForm({ ...form, precautions: e.target.value })}
                placeholder="운동 시 주의사항"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Label htmlFor="isActive">활성화</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            저장
          </Button>
        </div>
      </form>
    </div>
  );
}
