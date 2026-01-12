'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface GymReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gymId: string;
  gymName: string;
}

const REPORT_TYPES = [
  { value: 'info_wrong', label: '정보가 틀립니다' },
  { value: 'hours_changed', label: '운영시간이 변경되었습니다' },
  { value: 'closed', label: '폐업했습니다' },
  { value: 'moved', label: '이전했습니다' },
  { value: 'other', label: '기타' },
];

const FIELD_NAMES = [
  { value: 'name', label: '이름' },
  { value: 'address', label: '주소' },
  { value: 'phone', label: '전화번호' },
  { value: 'operatingHours', label: '운영시간' },
  { value: 'facilities', label: '시설 정보' },
  { value: 'other', label: '기타' },
];

export default function GymReportModal({
  isOpen,
  onClose,
  gymId,
  gymName,
}: GymReportModalProps) {
  const [reportType, setReportType] = useState<string>('');
  const [fieldName, setFieldName] = useState<string>('');
  const [currentValue, setCurrentValue] = useState('');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reportType) {
      toast.error('제보 유형을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/gyms/${gymId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          fieldName: fieldName || undefined,
          currentValue: currentValue || undefined,
          suggestedValue: suggestedValue || undefined,
          description: description || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '제보 제출에 실패했습니다.');
      }

      toast.success('제보가 접수되었습니다. 관리자 검토 후 반영됩니다.');
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '제보 제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReportType('');
    setFieldName('');
    setCurrentValue('');
    setSuggestedValue('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>정보 수정 제안</DialogTitle>
          <DialogDescription>
            {gymName}에 대한 정보 오류를 알려주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 제보 유형 */}
          <div className="space-y-2">
            <Label>제보 유형 *</Label>
            <RadioGroup value={reportType} onValueChange={setReportType}>
              {REPORT_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label htmlFor={type.value} className="font-normal cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* 수정 항목 */}
          {reportType === 'info_wrong' && (
            <div className="space-y-2">
              <Label>수정할 항목</Label>
              <RadioGroup value={fieldName} onValueChange={setFieldName}>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_NAMES.map((field) => (
                    <div key={field.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={field.value} id={`field-${field.value}`} />
                      <Label htmlFor={`field-${field.value}`} className="font-normal cursor-pointer">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* 현재 값 / 제안 값 */}
          {(reportType === 'info_wrong' || reportType === 'hours_changed') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="currentValue">현재 정보 (잘못된 정보)</Label>
                <Textarea
                  id="currentValue"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder="현재 표시된 정보를 입력해주세요"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suggestedValue">올바른 정보</Label>
                <Textarea
                  id="suggestedValue"
                  value={suggestedValue}
                  onChange={(e) => setSuggestedValue(e.target.value)}
                  placeholder="올바른 정보를 입력해주세요"
                  rows={2}
                />
              </div>
            </>
          )}

          {/* 추가 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">추가 설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="추가로 알려주실 내용이 있다면 입력해주세요"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reportType}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            제출
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
