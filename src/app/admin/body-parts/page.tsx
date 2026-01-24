"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BodyPart {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export default function BodyPartsPage() {
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    displayOrder: 0,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBodyParts();
  }, []);

  async function fetchBodyParts() {
    try {
      const res = await fetch("/api/admin/body-parts");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBodyParts(data.bodyParts);
    } catch (err) {
      toast.error("오류", { description: "데이터를 불러오지 못했습니다." });
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDialog = (bodyPart?: BodyPart) => {
    if (bodyPart) {
      setEditingId(bodyPart.id);
      setFormData({
        name: bodyPart.name,
        displayOrder: bodyPart.displayOrder,
        isActive: bodyPart.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        displayOrder: bodyParts.length + 1,
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("이름을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const url =
        "/api/admin/body-parts" + (editingId ? `?id=${editingId}` : "");
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("저장되었습니다.");
      setIsDialogOpen(false);
      fetchBodyParts();
    } catch (err) {
      toast.error("저장 실패", { description: "오류가 발생했습니다." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "정말 삭제하시겠습니까? 관련 데이터가 있으면 삭제되지 않을 수 있습니다.",
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/body-parts?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      toast.success("삭제되었습니다.");
      fetchBodyParts();
    } catch (err) {
      toast.error("삭제 실패", {
        description:
          err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Body Parts Master</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          부위 추가
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">순서</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bodyParts.map((bp) => (
                <TableRow key={bp.id}>
                  <TableCell>{bp.displayOrder}</TableCell>
                  <TableCell className="font-medium">{bp.name}</TableCell>
                  <TableCell>
                    {bp.isActive ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        활성
                      </Badge>
                    ) : (
                      <Badge variant="secondary">비활성</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(bp)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(bp.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "부위 수정" : "부위 추가"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="예: 어깨"
              />
            </div>
            <div className="space-y-2">
              <Label>표시 순서</Label>
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    displayOrder: parseInt(e.target.value),
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="active"
                checked={formData.isActive}
                onCheckedChange={(c) =>
                  setFormData((prev) => ({ ...prev, isActive: !!c }))
                }
              />
              <Label htmlFor="active">활성화</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
