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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface EquipmentType {
  id: string;
  name: string;
}

interface Mapping {
  id: string;
  equipmentTypeId: string;
  exerciseTemplateId: string;
  exerciseTemplate: {
    name: string;
  };
  isRequired: boolean;
  isDirty?: boolean;
}

export default function EquipmentMappingPage() {
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [mappings, setMappings] = useState<Mapping[]>([]);

  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Load Equipment
  useEffect(() => {
    async function fetchEquipment() {
      try {
        const res = await fetch("/api/admin/mappings/equipment");
        if (!res.ok) throw new Error("Failed to fetch equipment");
        const data = await res.json();
        setEquipment(data.equipment);
        if (data.equipment.length > 0) {
          setSelectedEquipmentId(data.equipment[0].id);
        }
      } catch (err) {
        toast.error("오류", { description: "기구 목록을 불러오지 못했습니다." });
      } finally {
        setLoadingEquipment(false);
      }
    }
    fetchEquipment();
  }, []);

  // 2. Load Mappings
  useEffect(() => {
    if (!selectedEquipmentId) return;

    async function fetchMappings() {
      setLoadingMappings(true);
      try {
        const res = await fetch(
          `/api/admin/mappings/equipment?equipmentId=${selectedEquipmentId}`,
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
  }, [selectedEquipmentId]);

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
        equipmentTypeId: selectedEquipmentId,
        updates: dirtyMappings.map((m) => ({
          id: m.id,
          exerciseTemplateId: m.exerciseTemplateId,
          isRequired: m.isRequired,
        })),
      };

      const res = await fetch("/api/admin/mappings/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("저장 완료", { description: "변경사항이 저장되었습니다." });

      const reloadRes = await fetch(
        `/api/admin/mappings/equipment?equipmentId=${selectedEquipmentId}`,
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
      const res = await fetch(`/api/admin/mappings/equipment?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      setMappings(mappings.filter((m) => m.id !== id));
      toast.success("삭제 완료", { description: "매핑이 삭제되었습니다." });
    } catch (err) {
      toast.error("삭제 실패", { description: "삭제 중 오류가 발생했습니다." });
    }
  };

  if (loadingEquipment) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Equipment Mappings</h1>
        <div className="flex items-center gap-4">
          <Select
            value={selectedEquipmentId}
            onValueChange={setSelectedEquipmentId}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="기구 선택" />
            </SelectTrigger>
            <SelectContent>
              {equipment.map((eq) => (
                <SelectItem key={eq.id} value={eq.id}>
                  {eq.name}
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
            {equipment.find((e) => e.id === selectedEquipmentId)?.name} 운동
            목록 ({mappings.length})
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
                  <TableHead>운동 이름</TableHead>
                  <TableHead>필수 여부</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping, index) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">
                      {mapping.exerciseTemplate.name}
                      {mapping.isDirty && (
                        <Badge variant="secondary" className="ml-2">
                          수정됨
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`req-${mapping.id}`}
                          checked={mapping.isRequired}
                          onCheckedChange={(checked) =>
                            handleUpdate(index, "isRequired", !!checked)
                          }
                        />
                        <label
                          htmlFor={`req-${mapping.id}`}
                          className="text-sm cursor-pointer"
                        >
                          필수 장비
                        </label>
                      </div>
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
                      colSpan={3}
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
