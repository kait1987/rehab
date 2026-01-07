/**
 * @file page.tsx
 * @description 헬스장 검색 페이지
 * 
 * 위치 기반 헬스장 검색 및 결과 표시 페이지입니다.
 * 
 * 주요 기능:
 * - 브라우저 Geolocation API를 통한 위치 기반 검색
 * - 키워드 검색 입력창
 * - /api/gyms/search API 호출
 * - 검색 결과를 GymCard 컴포넌트로 표시
 * - 로딩 상태, 에러 상태, Empty 상태 처리
 * 
 * @dependencies
 * - @/components/gym-card: 헬스장 카드 컴포넌트
 * - @/types/gym-search: GymSearchResponse 타입
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Loader2, AlertCircle, List, Map as MapIcon } from 'lucide-react';
import { GymCard } from '@/components/gym-card';
import { GymMap } from '@/components/gym-map';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getBusinessStatus } from '@/lib/utils/check-business-status';
import type { GymSearchResponse, GymSearchResult } from '@/types/gym-search';

type SearchState = 'idle' | 'loading' | 'success' | 'error';
type SortOption = 'distance' | 'rating';
type ViewMode = 'list' | 'map';

export default function GymsPage() {
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [gyms, setGyms] = useState<GymSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // 필터 상태
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [showOpenOnly, setShowOpenOnly] = useState<boolean>(false);
  
  // 페이지네이션
  const [displayCount, setDisplayCount] = useState<number>(10);
  
  // 뷰 모드 (리스트/지도)
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  /**
   * 브라우저 위치 권한 요청 및 좌표 획득
   */
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('브라우저가 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setLocationError(null);
    setSearchState('loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        // 위치 획득 후 자동 검색
        searchGyms(latitude, longitude, searchQuery);
      },
      (err) => {
        setLocationError(
          err.code === 1
            ? '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.'
            : '위치를 가져올 수 없습니다. 다시 시도해주세요.'
        );
        setSearchState('idle');
      }
    );
  };

  /**
   * 헬스장 검색 API 호출
   */
  const searchGyms = async (lat: number, lng: number, query?: string) => {
    setSearchState('loading');
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: '1000', // 1km
      });

      if (query && query.trim().length > 0) {
        params.append('query', query.trim());
      }

      const response = await fetch(`/api/gyms/search?${params.toString()}`);
      const data: GymSearchResponse = await response.json();

      if (!response.ok || !data.success) {
        // 에러 메시지를 사용자 친화적으로 변환
        let userFriendlyError = data.error || '검색에 실패했습니다.';
        
        // 네이버맵 API 인증 실패 에러 처리
        if (userFriendlyError.includes('인증에 실패했습니다') || 
            userFriendlyError.includes('Authentication failed') ||
            userFriendlyError.includes('NID AUTH')) {
          userFriendlyError = '외부 지도 서비스 연결에 문제가 있습니다. 저장된 헬스장 정보만 표시됩니다.';
        }
        
        // API 실패 시에도 DB 결과가 있을 수 있으므로, 빈 배열이 아닌 경우 성공으로 처리
        if (data.data && data.data.length > 0) {
          setGyms(data.data);
          setSearchState('success');
          // 경고 메시지로 표시 (에러가 아닌)
          setError(userFriendlyError);
          return;
        }
        
        throw new Error(userFriendlyError);
      }

      setGyms(data.data || []);
      setSearchState('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      setSearchState('error');
    }
  };

  /**
   * 검색 버튼 클릭 핸들러
   */
  const handleSearch = () => {
    if (!location) {
      requestLocation();
      return;
    }

    searchGyms(location.lat, location.lng, searchQuery);
  };

  /**
   * Enter 키 입력 핸들러
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * 필터링 및 정렬된 헬스장 목록
   */
  const filteredAndSortedGyms = useMemo(() => {
    let filtered = [...gyms];

    // 운영중만 보기 필터
    if (showOpenOnly) {
      filtered = filtered.filter((gym) => {
        if (!gym.operatingHours || gym.operatingHours.length === 0) {
          return false; // 운영시간 정보 없으면 제외
        }
        const status = getBusinessStatus(gym.operatingHours);
        return status.isOpen;
      });
    }

    // 정렬
    if (sortBy === 'distance') {
      filtered.sort((a, b) => a.distanceMeters - b.distanceMeters);
    } else if (sortBy === 'rating') {
      // 평점순은 향후 구현 (현재는 거리순과 동일하게 처리)
      filtered.sort((a, b) => a.distanceMeters - b.distanceMeters);
    }

    return filtered;
  }, [gyms, sortBy, showOpenOnly]);

  /**
   * 표시할 헬스장 목록 (페이지네이션 적용)
   */
  const displayedGyms = useMemo(() => {
    return filteredAndSortedGyms.slice(0, displayCount);
  }, [filteredAndSortedGyms, displayCount]);

  /**
   * 더 보기 버튼 클릭 핸들러
   */
  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 10);
  };

  /**
   * 검색 결과가 변경되면 표시 개수 초기화
   */
  useEffect(() => {
    if (searchState === 'success') {
      setDisplayCount(10);
    }
  }, [searchState, gyms.length]);

  return (
    <main className="min-h-[calc(100vh-80px)] container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            내 주변 헬스장 찾기
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            위치 기반으로 주변 재활 헬스장을 검색해보세요
          </p>
        </div>

        {/* 검색바 */}
        <Card className="p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 위치 버튼 */}
            <Button
              onClick={requestLocation}
              disabled={searchState === 'loading'}
              className="w-full sm:w-auto"
              variant="outline"
            >
              <MapPin className="h-4 w-4 mr-2" strokeWidth={1.5} />
              {location ? '위치 재설정' : '내 위치 사용'}
            </Button>

            {/* 검색 입력창 */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  type="text"
                  placeholder="헬스장 이름으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={searchState === 'loading' || !location}
                className="bg-primary hover:bg-primary-hover text-white"
              >
                {searchState === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" strokeWidth={1.5} />
                    검색 중...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" strokeWidth={1.5} />
                    검색
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 위치 에러 메시지 */}
          {locationError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          )}

          {/* 현재 위치 표시 */}
          {location && (
            <p className="text-xs text-muted-foreground mt-3">
              검색 위치: 위도 {location.lat.toFixed(6)}, 경도 {location.lng.toFixed(6)}
            </p>
          )}
        </Card>

        {/* 필터 섹션 */}
        {searchState === 'success' && gyms.length > 0 && (
          <Card className="p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full sm:w-auto">
                {/* 정렬 옵션 */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="sort-select" className="text-sm text-muted-foreground whitespace-nowrap">
                    정렬:
                  </Label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger id="sort-select" className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="distance">거리순</SelectItem>
                      <SelectItem value="rating" disabled>평점순 (준비중)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 운영중만 보기 */}
                <div className="flex items-center gap-2">
                  <Switch
                    id="open-only"
                    checked={showOpenOnly}
                    onCheckedChange={setShowOpenOnly}
                  />
                  <Label htmlFor="open-only" className="text-sm text-foreground cursor-pointer">
                    운영중만 보기
                  </Label>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* 결과 개수 */}
                <div className="text-sm text-muted-foreground">
                  {filteredAndSortedGyms.length}개 표시
                  {showOpenOnly && filteredAndSortedGyms.length < gyms.length && (
                    <span className="text-xs ml-1">
                      (전체 {gyms.length}개 중)
                    </span>
                  )}
                </div>

                {/* 뷰 모드 토글 버튼 */}
                <div className="flex items-center gap-2 border-l border-border pl-3">
                  <Button
                    onClick={() => setViewMode('list')}
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    className={viewMode === 'list' 
                      ? 'bg-primary hover:bg-primary-hover text-white' 
                      : 'bg-transparent hover:bg-muted'
                    }
                  >
                    <List className="h-4 w-4 mr-1" strokeWidth={1.5} />
                    리스트
                  </Button>
                  <Button
                    onClick={() => setViewMode('map')}
                    variant={viewMode === 'map' ? 'default' : 'outline'}
                    size="sm"
                    className={viewMode === 'map' 
                      ? 'bg-primary hover:bg-primary-hover text-white' 
                      : 'bg-transparent hover:bg-muted'
                    }
                  >
                    <MapIcon className="h-4 w-4 mr-1" strokeWidth={1.5} />
                    지도
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 검색 결과 */}
        {searchState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" strokeWidth={1.5} />
            <p className="text-muted-foreground">헬스장을 검색하고 있습니다...</p>
          </div>
        )}

        {searchState === 'error' && error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 경고 메시지 (API 실패했지만 DB 결과는 있음) */}
        {searchState === 'success' && error && (
          <Alert variant="default" className="mb-6 border-yellow-500/30 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4 text-yellow-500" strokeWidth={1.5} />
            <AlertDescription className="text-yellow-500/90">{error}</AlertDescription>
          </Alert>
        )}

        {searchState === 'success' && (
          <>
            {gyms.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground text-lg mb-2">검색 결과가 없습니다</p>
                <p className="text-sm text-muted-foreground/80">
                  다른 키워드로 검색하거나 검색 반경을 넓혀보세요.
                </p>
              </Card>
            ) : (
              <>
                {displayedGyms.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground text-lg mb-2">필터 조건에 맞는 헬스장이 없습니다</p>
                    <p className="text-sm text-muted-foreground/80">
                      필터를 조정하거나 다른 키워드로 검색해보세요.
                    </p>
                  </Card>
                ) : (
                  <>
                    {viewMode === 'list' ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          {displayedGyms.map((gym) => (
                            <GymCard key={gym.id} gym={gym} />
                          ))}
                        </div>

                        {/* 더 보기 버튼 */}
                        {displayedGyms.length < filteredAndSortedGyms.length && (
                          <div className="flex justify-center mt-8">
                            <Button
                              onClick={handleLoadMore}
                              variant="outline"
                              className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                            >
                              더 보기 ({filteredAndSortedGyms.length - displayedGyms.length}개 남음)
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full">
                        <GymMap
                          gyms={displayedGyms}
                          center={location}
                          userLocation={location}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* 초기 상태 안내 */}
        {searchState === 'idle' && !locationError && (
          <Card className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" strokeWidth={1.5} />
            <p className="text-muted-foreground text-lg mb-2">위치를 설정해주세요</p>
            <p className="text-sm text-muted-foreground/80 mb-4">
              '내 위치 사용' 버튼을 클릭하여 주변 헬스장을 검색하세요.
            </p>
            <Button onClick={requestLocation} className="bg-primary hover:bg-primary-hover text-white">
              <MapPin className="h-4 w-4 mr-2" strokeWidth={1.5} />
              내 위치 사용
            </Button>
          </Card>
        )}
      </div>
    </main>
  );
}

