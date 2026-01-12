'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface BodyPart {
  id: string;
  name: string;
}

interface PainProfile {
  id: string;
  bodyPartId: string;
  bodyPartName: string;
  painLevel: number;
  experienceLevel: string | null;
  equipmentAvailable: string[];
}

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: '초급 (운동 경험 거의 없음)' },
  { value: 'intermediate', label: '중급 (주 2-3회 운동)' },
  { value: 'advanced', label: '고급 (주 4회 이상)' },
];

const EQUIPMENT_OPTIONS = [
  '매트', '덤벨', '밴드', '짐볼', '폼롤러', '케틀벨', '바벨', '머신'
];

export default function MyProfilePage() {
  const [profiles, setProfiles] = useState<PainProfile[]>([]);
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 새 프로필 입력 상태
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [painLevel, setPainLevel] = useState<number>(3);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // 프로필 조회
      const profileRes = await fetch('/api/users/pain-profile');
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfiles(data.items || []);
      }

      // 부위 목록 조회
      const bodyPartRes = await fetch('/api/body-parts');
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
      const res = await fetch('/api/users/pain-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyPartId: selectedBodyPart,
          painLevel,
          experienceLevel: experienceLevel || undefined,
          equipmentAvailable: equipment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '저장에 실패했습니다.');
      }

      toast.success(data.message);
      
      // 목록 새로고침
      fetchData();
      
      // 입력 초기화
      setSelectedBodyPart('');
      setPainLevel(3);
      setExperienceLevel('');
      setEquipment([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  function toggleEquipment(item: string) {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">내 프로필</h1>

      {/* 기존 프로필 목록 */}
      {profiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">저장된 부상 부위</CardTitle>
            <CardDescription>운동 코스 생성 시 이 정보가 활용됩니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium">{profile.bodyPartName}</p>
                  <p className="text-sm text-muted-foreground">
                    통증 레벨: {profile.painLevel}/5
                    {profile.experienceLevel && ` · ${profile.experienceLevel}`}
                  </p>
                </div>
                <Badge variant="outline">
                  기구 {profile.equipmentAvailable?.length || 0}개
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 새 프로필 추가 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            부위 추가/수정
          </CardTitle>
          <CardDescription>
            같은 부위를 선택하면 기존 정보가 업데이트됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 부위 선택 */}
          <div className="space-y-2">
            <Label>부위 선택 *</Label>
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
            <Label>통증 레벨 (1-5)</Label>
            <RadioGroup
              value={String(painLevel)}
              onValueChange={(v) => setPainLevel(Number(v))}
              className="flex gap-4"
            >
              {[1, 2, 3, 4, 5].map((level) => (
                <div key={level} className="flex items-center gap-1">
                  <RadioGroupItem value={String(level)} id={`pain-${level}`} />
                  <Label htmlFor={`pain-${level}`} className="font-normal cursor-pointer">
                    {level}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              1: 거의 없음 ~ 5: 매우 심함
            </p>
          </div>

          {/* 운동 경험 */}
          <div className="space-y-2">
            <Label>운동 경험 (선택)</Label>
            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger>
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 사용 가능 기구 */}
          <div className="space-y-2">
            <Label>사용 가능 기구 (선택)</Label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((item) => (
                <Badge
                  key={item}
                  variant={equipment.includes(item) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleEquipment(item)}
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          {/* 저장 버튼 */}
          <Button
            onClick={handleSave}
            disabled={saving || !selectedBodyPart}
            className="w-full"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            저장
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
