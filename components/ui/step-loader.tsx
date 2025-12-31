import React from 'react';

/**
 * Step Loader 컴포넌트
 * 
 * 공이 계단을 올라가는 애니메이션을 보여주는 로딩 컴포넌트입니다.
 * 통증 체크 데이터 저장 시 사용됩니다.
 */
export default function StepLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="loader"></div>
      <p className="text-muted-foreground font-medium animate-pulse">
        재활 데이터를 분석 중입니다...
      </p>
    </div>
  );
}

