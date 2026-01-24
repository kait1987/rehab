"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ImageIcon, Loader2, Save } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Admin Template Detail/Edit Page
 * 운동 템플릿 상세 조회 및 수정
 */

interface BodyPart {
  id: string;
  name: string;
}

interface EquipmentType {
  id: string;
  name: string;
}

interface BodyPartMapping {
  bodyPartId: string;
  bodyPart: BodyPart;
  intensityLevel: number | null;
  priority: number | null;
  painLevelRange: string | null;
}

interface EquipmentMapping {
  equipmentTypeId: string;
  equipmentType: EquipmentType;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  precautions: string | null;
  difficultyScore: number | null;
  imageUrl: string | null;
  gifUrl: string | null;
  videoUrl: string | null;
  isActive: boolean;
  bodyPart: BodyPart | null;
  bodyPartMappings: BodyPartMapping[];
  exerciseEquipmentMappings: EquipmentMapping[];
}

interface FormData {
  name: string;
  description: string;
  instructions: string;
  precautions: string;
  difficultyScore: number;
  imageUrl: string;
  gifUrl: string;
  videoUrl: string;
  isActive: boolean;
  bodyPartMappings: {
    bodyPartId: string;
    intensityLevel: number;
    priority: number;
    painLevelRange: string;
  }[];
  equipmentIds: string[];
}

export default function AdminTemplateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [allBodyParts, setAllBodyParts] = useState<BodyPart[]>([]);
  const [allEquipmentTypes, setAllEquipmentTypes] = useState<EquipmentType[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    instructions: "",
    precautions: "",
    difficultyScore: 2,
    imageUrl: "",
    gifUrl: "",
    videoUrl: "",
    isActive: true,
    bodyPartMappings: [],
    equipmentIds: [],
  });

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const res = await fetch(`/api/admin/templates/${id}`);
        if (!res.ok) throw new Error("Failed to fetch template");
        const data = await res.json();

        setTemplate(data.template);
        setAllBodyParts(data.allBodyParts);
        setAllEquipmentTypes(data.allEquipmentTypes);

        // Initialize form data
        setFormData({
          name: data.template.name || "",
          description: data.template.description || "",
          instructions: data.template.instructions || "",
          precautions: data.template.precautions || "",
          difficultyScore: data.template.difficultyScore || 2,
          imageUrl: data.template.imageUrl || "",
          gifUrl: data.template.gifUrl || "",
          videoUrl: data.template.videoUrl || "",
          isActive: data.template.isActive ?? true,
          bodyPartMappings: data.template.bodyPartExerciseMappings.map(
            (m: BodyPartMapping) => ({
              bodyPartId: m.bodyPartId,
              intensityLevel: m.intensityLevel ?? 2,
              priority: m.priority ?? 1,
              painLevelRange: m.painLevelRange ?? "all",
            }),
          ),
          equipmentIds: data.template.exerciseEquipmentMappings.map(
            (m: EquipmentMapping) => m.equipmentTypeId,
          ),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplate();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/admin/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleBodyPartToggle = (bodyPartId: string) => {
    setFormData((prev) => {
      const exists = prev.bodyPartMappings.find(
        (m) => m.bodyPartId === bodyPartId,
      );
      if (exists) {
        return {
          ...prev,
          bodyPartMappings: prev.bodyPartMappings.filter(
            (m) => m.bodyPartId !== bodyPartId,
          ),
        };
      } else {
        return {
          ...prev,
          bodyPartMappings: [
            ...prev.bodyPartMappings,
            {
              bodyPartId,
              intensityLevel: 2,
              priority: 1,
              painLevelRange: "all",
            },
          ],
        };
      }
    });
  };

  const handleBodyPartMappingChange = (
    bodyPartId: string,
    field: "intensityLevel" | "priority" | "painLevelRange",
    value: number | string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      bodyPartMappings: prev.bodyPartMappings.map((m) =>
        m.bodyPartId === bodyPartId ? { ...m, [field]: value } : m,
      ),
    }));
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      equipmentIds: prev.equipmentIds.includes(equipmentId)
        ? prev.equipmentIds.filter((id) => id !== equipmentId)
        : [...prev.equipmentIds, equipmentId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로
        </Button>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <p className="text-red-600">오류: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로
          </Button>
          <h1 className="text-2xl font-bold">{template?.name}</h1>
          {!formData.isActive && <Badge variant="secondary">비활성</Badge>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            저장
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <p className="text-red-600">오류: {error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Image & Basic Info */}
        <div className="space-y-6">
          {/* Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">이미지</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {formData.imageUrl ? (
                  <Image
                    src={formData.imageUrl}
                    alt={formData.name}
                    width={300}
                    height={300}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <span className="text-sm">이미지 없음</span>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>이미지 업로드</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (file.size > 5 * 1024 * 1024) {
                        alert("파일 크기는 5MB 이하여야 합니다.");
                        return;
                      }

                      const formData = new FormData();
                      formData.append("file", file);

                      try {
                        e.target.disabled = true;
                        const res = await fetch("/api/admin/upload-image", {
                          method: "POST",
                          body: formData,
                        });

                        if (!res.ok) {
                          const data = await res.json();
                          throw new Error(data.error || "Upload failed");
                        }

                        const data = await res.json();
                        setFormData((prev) => ({
                          ...prev,
                          imageUrl: data.url,
                        }));
                      } catch (err) {
                        alert(
                          err instanceof Error ? err.message : "업로드 실패",
                        );
                      } finally {
                        e.target.disabled = false;
                        e.target.value = ""; // Reset input
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>이미지 URL (직접 입력)</Label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: !!checked }))
                  }
                />
                <Label htmlFor="isActive">활성화</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Basic Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>이름</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>설명</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label>수행 방법</Label>
                <Textarea
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>
              <div>
                <Label>주의사항</Label>
                <Textarea
                  value={formData.precautions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      precautions: e.target.value,
                    }))
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label>난이도 (1-5)</Label>
                <Select
                  value={String(formData.difficultyScore)}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      difficultyScore: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - 매우 쉬움</SelectItem>
                    <SelectItem value="2">2 - 쉬움</SelectItem>
                    <SelectItem value="3">3 - 보통</SelectItem>
                    <SelectItem value="4">4 - 어려움</SelectItem>
                    <SelectItem value="5">5 - 매우 어려움</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Mappings */}
        <div className="space-y-6">
          {/* Body Part Mappings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">부위 매핑</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {allBodyParts.map((bodyPart) => {
                const mapping = formData.bodyPartMappings.find(
                  (m) => m.bodyPartId === bodyPart.id,
                );
                const isChecked = !!mapping;

                return (
                  <div key={bodyPart.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`bp-${bodyPart.id}`}
                        checked={isChecked}
                        onCheckedChange={() =>
                          handleBodyPartToggle(bodyPart.id)
                        }
                      />
                      <Label
                        htmlFor={`bp-${bodyPart.id}`}
                        className="font-medium"
                      >
                        {bodyPart.name}
                      </Label>
                    </div>
                    {isChecked && (
                      <div className="ml-6 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <Label className="text-xs">강도</Label>
                          <Select
                            value={String(mapping?.intensityLevel ?? 2)}
                            onValueChange={(v) =>
                              handleBodyPartMappingChange(
                                bodyPart.id,
                                "intensityLevel",
                                parseInt(v),
                              )
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                  {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">통증 범위</Label>
                          <Select
                            value={mapping?.painLevelRange ?? "all"}
                            onValueChange={(v) =>
                              handleBodyPartMappingChange(
                                bodyPart.id,
                                "painLevelRange",
                                v,
                              )
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">전체</SelectItem>
                              <SelectItem value="1-2">1-2</SelectItem>
                              <SelectItem value="3-4">3-4</SelectItem>
                              <SelectItem value="5">5</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Equipment Mappings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">기구 매핑</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {allEquipmentTypes.map((equipment) => (
                <div key={equipment.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`eq-${equipment.id}`}
                    checked={formData.equipmentIds.includes(equipment.id)}
                    onCheckedChange={() => handleEquipmentToggle(equipment.id)}
                  />
                  <Label htmlFor={`eq-${equipment.id}`}>{equipment.name}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
