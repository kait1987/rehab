'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flag } from 'lucide-react';
import GymReportModal from './gym-report-modal';

interface GymReportButtonProps {
  gymId: string;
  gymName: string;
}

export default function GymReportButton({ gymId, gymName }: GymReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Flag className="w-4 h-4" />
        정보 수정 제안
      </Button>

      <GymReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        gymId={gymId}
        gymName={gymName}
      />
    </>
  );
}
