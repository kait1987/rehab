/**
 * @file gym-actions.tsx
 * @description 헬스장 액션 버튼 컴포넌트
 * 
 * 헬스장 상세 페이지의 액션 버튼들을 표시합니다.
 * 
 * 주요 기능:
 * - 즐겨찾기 추가/제거 버튼 (로그인: API, 비로그인: localStorage)
 * - 리뷰 작성 버튼
 * - 로그인 상태에 따른 조건부 렌더링
 * - sticky bottom 배치
 * 
 * @dependencies
 * - @clerk/nextjs: useUser
 * - @/components/ui/button: Button 컴포넌트
 * - @/hooks/use-local-favorites: localStorage 즐겨찾기 훅
 * - lucide-react: 아이콘
 */

'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocalFavorites } from '@/hooks/use-local-favorites';

interface GymActionsProps {
  gymId: string;
  gymName: string;
  gymAddress: string;
  initialIsFavorite: boolean;
}

export function GymActions({ gymId, gymName, gymAddress, initialIsFavorite }: GymActionsProps) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);

  // localStorage 즐겨찾기 훅 (비로그인 사용자용)
  const { 
    isFavorite: isLocalFavorite, 
    addFavorite: addLocalFavorite, 
    removeFavorite: removeLocalFavorite,
    isAvailable: isStorageAvailable 
  } = useLocalFavorites();

  // 🔑 1단계: 로딩 체크 (가장 중요!)
  if (!isLoaded) {
    return (
      <div className="sticky bottom-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border rounded-lg p-4 shadow-lg z-10">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-12 flex-1 bg-muted rounded-lg animate-pulse" />
          <div className="h-12 flex-1 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  // 로그인 사용자 즐겨찾기 토글 핸들러 (API)
  const handleFavoriteToggleLoggedIn = async () => {
    setIsLoading(true);
    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      const res = await fetch(`/api/gyms/${gymId}/favorite`, { method });

      if (res.ok) {
        setIsFavorite(!isFavorite);
      } else {
        console.error('Favorite toggle failed');
      }
    } catch (error) {
      console.error('Favorite toggle error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 비로그인 사용자 즐겨찾기 토글 핸들러 (localStorage)
  const handleFavoriteToggleLoggedOut = () => {
    if (isLocalFavorite(gymId)) {
      removeLocalFavorite(gymId);
    } else {
      addLocalFavorite({ gymId, name: gymName, address: gymAddress });
    }
  };

  // 🔑 2단계: 로그인 상태에 따른 완전 다른 UI
  if (isSignedIn) {
    return (
      <div className="sticky bottom-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border rounded-lg p-4 shadow-lg z-10">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* ✅ 로그인: 리뷰 작성 직접 링크 */}
          <Button asChild className="flex-1 bg-primary hover:bg-primary-hover text-white" size="lg">
            <Link href={`/gyms/${gymId}/review`}>
              <MessageSquare className="mr-2 h-4 w-4" strokeWidth={1.5} />
              리뷰 작성하기
            </Link>
          </Button>
          
          {/* 즐겨찾기 버튼 (API) */}
          <Button
            variant={isFavorite ? 'default' : 'outline'}
            onClick={handleFavoriteToggleLoggedIn}
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary-hover text-white"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
            ) : (
              <Heart
                className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-current' : ''}`}
                strokeWidth={1.5}
              />
            )}
            {isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
          </Button>
        </div>
      </div>
    );
  }

  // 🆕 비로그인 사용자: localStorage 즐겨찾기
  const localFav = isLocalFavorite(gymId);

  return (
    <div className="sticky bottom-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border rounded-lg p-4 shadow-lg z-10">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 리뷰 작성: 로그인 유도 */}
        <Button 
          variant="outline" 
          size="lg" 
          className="flex-1"
          onClick={() => router.push('/sign-in')}
        >
          <MessageSquare className="mr-2 h-4 w-4" strokeWidth={1.5} />
          로그인 후 리뷰 작성
        </Button>

        {/* 즐겨찾기 버튼 (localStorage) */}
        <Button 
          variant={localFav ? 'default' : 'outline'}
          size="lg" 
          className={`flex-1 ${localFav ? 'bg-primary hover:bg-primary-hover text-white' : ''}`}
          onClick={handleFavoriteToggleLoggedOut}
          disabled={!isStorageAvailable}
        >
          <Heart 
            className={`mr-2 h-4 w-4 ${localFav ? 'fill-current' : ''}`} 
            strokeWidth={1.5} 
          />
          {localFav ? '즐겨찾기 해제' : '즐겨찾기'}
        </Button>
      </div>
    </div>
  );
}

