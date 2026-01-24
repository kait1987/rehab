"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Save, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface BodyPart {
  id: string;
  name: string;
}

interface Mapping {
  id: string;
  bodyPartId: string;
  exerciseTemplateId: string;
  exerciseTemplate: {
    name: string;
    description: string | null;
  };
  intensityLevel: number | null;
  priority: number;
  painLevelRange: string | null;
  isDirty?: boolean; // For tracking unsaved changes
}

export default function BodyPartMappingPage() {
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [selectedBodyPartId, setSelectedBodyPartId] = useState<string>("");
  const [mappings, setMappings] = useState<Mapping[]>([]);

  const [loadingBodyParts, setLoadingBodyParts] = useState(true);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Load Body Parts
  useEffect(() => {
    async function fetchBodyParts() {
      try {
        const res = await fetch("/api/admin/mappings/body-parts");
        if (!res.ok) throw new Error("Failed to fetch body parts");
        const data = await res.json();
        setBodyParts(data.bodyParts);
        if (data.bodyParts.length > 0) {
          setSelectedBodyPartId(data.bodyParts[0].id);
        }
      } catch (err) {
        toast.error("오류", { description: "부위 목록을 불러오지 못했습니다." });
      } finally {
        setLoadingBodyParts(false);
      }
    }
    fetchBodyParts();
  }, []);

  // 2. Load Mappings when Body Part Selected
  useEffect(() => {
    if (!selectedBodyPartId) return;

    async function fetchMappings() {
      setLoadingMappings(true);
      try {
        const res = await fetch(
          `/api/admin/mappings/body-parts?bodyPartId=${selectedBodyPartId}`,
        );
        if (!res.ok) throw new Error("Failed to fetch mappings");
        const data = await res.json();
        setMappings(data.mappings);
      } catch (err) {
        toast.error("오류", { description: "매핑 데이터를 불러오지 못했습니다." });
      } finally {
        setLoadingMappings(false);
      }
    }
    fetchMappings();
  }, [selectedBodyPartId]);

  // Handle Updates
  const handleUpdate = (index: number, field: keyof Mapping, value: any) => {
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      [field]: value,
      isDirty: true,
    };
    setMappings(newMappings);
  };

  const handleCreateBatch = async () => {
    const dirtyMappings = mappings.filter((m) => m.isDirty);
    if (dirtyMappings.length === 0) return;

    setSaving(true);
    try {
      const payload = {
        bodyPartId: selectedBodyPartId,
        updates: dirtyMappings.map((m) => ({
          id: m.id,
          exerciseTemplateId: m.exerciseTemplateId,
          intensityLevel: m.intensityLevel,
          priority: m.priority,
          painLevelRange: m.painLevelRange,
        })),
      };

      const res = await fetch("/api/admin/mappings/body-parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("저장 완료", { description: "변경사항이 저장되었습니다." });

      // Reload to clear dirty state
      const reloadRes = await fetch(
        `/api/admin/mappings/body-parts?bodyPartId=${selectedBodyPartId}`,
      );
      const reloadData = await reloadRes.json();
      setMappings(reloadData.mappings);
    } catch (err) {
      toast.error("저장 실패", { description: "변경사항을 저장하지 못했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/admin/mappings/body-parts?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setMappings(mappings.filter((m) => m.id !== id));
      toast.success("삭제 완료", { description: "매핑이 삭제되었습니다." });
    } catch (err) {
      toast.error("삭제 실패", { description: "삭제 중 오류가 발생했습니다." });
    }
  };

  if (loadingBodyParts) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Body Part Mappings</h1>
        <div className="flex items-center gap-4">
          <Select
            value={selectedBodyPartId}
            onValueChange={setSelectedBodyPartId}
          >
            <SelectTrigger className="w-[180px]">
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
          <Button
            onClick={handleCreateBatch}
            disabled={saving || !mappings.some((m) => m.isDirty)}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            변경사항 저장
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {bodyParts.find((b) => b.id === selectedBodyPartId)?.name} 운동 목록
            ({mappings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMappings ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>우선순위</TableHead>
                  <TableHead>운동 이름</TableHead>
                  <TableHead>강도 (1-5)</TableHead>
                  <TableHead>통증 범위</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping, index) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="w-[100px]">
                      <Input
                        type="number"
                        value={mapping.priority}
                        onChange={(e) =>
                          handleUpdate(
                            index,
                            "priority",
                            parseInt(e.target.value),
                          )
                        }
                        className="w-16 h-8"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {mapping.exerciseTemplate.name}
                      {mapping.isDirty && (
                        <Badge variant="secondary" className="ml-2">
                          수정됨
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={String(mapping.intensityLevel ?? 1)}
                        onValueChange={(v) =>
                          handleUpdate(index, "intensityLevel", parseInt(v))
                        }
                      >
                        <SelectTrigger className="w-[80px] h-8">
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
                    </TableCell>
                    <TableCell>
                      <Select
                        value={mapping.painLevelRange ?? "all"}
                        onValueChange={(v) =>
                          handleUpdate(index, "painLevelRange", v)
                        }
                      >
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          <SelectItem value="1-2">1-2</SelectItem>
                          <SelectItem value="3-4">3-4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(mapping.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {mappings.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground h-24"
                    >
                      등록된 운동이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
