/**
 * @file gym-map-directions.tsx
 * @description 헬스장 네이버맵 길찾기 컴포넌트
 * 
 * 헬스장 위치를 지도에 표시하고 네이버맵 길찾기 기능을 제공합니다.
 * 
 * 주요 기능:
 * - 네이버맵 지도 표시 (헬스장 위치 중심)
 * - 사용자 현재 위치 마커 (Geolocation API, 선택적)
 * - 헬스장 위치 마커
 * - 네이버맵 길찾기 버튼
 * 
 * @dependencies
 * - 네이버 지도 API v3: https://navermaps.github.io/maps.js.ncp/
 * - @/components/ui/card: Card 컴포넌트
 * - @/components/ui/button: Button 컴포넌트
 * - lucide-react: 아이콘
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

declare global {
  interface Window {
    naver: any;
  }
}

interface GymMapDirectionsProps {
  gym: {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
}

export function GymMapDirections({ gym }: GymMapDirectionsProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const gymMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 네이버맵 스크립트 로드
   */
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

    if (!clientId) {
      setError('네이버맵 API 키가 설정되지 않았습니다.');
      setIsLoading(false);
      return;
    }

    // 이미 로드되었으면 중복 로딩 방지
    if (window.naver) {
      setIsLoading(false);
      return;
    }

    const scriptId = 'naver-map-script';

    // 이미 스크립트가 있으면 제거
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // 스크립트 생성 및 추가
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => {
      setIsLoading(false);
    };
    script.onerror = () => {
      setError('네이버맵 스크립트 로드 실패');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거하지 않음 (다른 컴포넌트에서 사용 가능)
    };
  }, []);

  /**
   * 사용자 현재 위치 가져오기 (선택적)
   */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // 실패해도 헬스장 위치는 표시
        }
      );
    }
  }, []);

  /**
   * 네이버맵 초기화 및 마커 표시
   */
  useEffect(() => {
    if (isLoading || error || !window.naver || !mapRef.current) {
      return;
    }

    if (!mapInstanceRef.current) {
      // 지도 초기화
      mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(gym.latitude, gym.longitude),
        zoom: 16,
      });
    } else {
      // 지도 중심점 업데이트
      mapInstanceRef.current.setCenter(
        new window.naver.maps.LatLng(gym.latitude, gym.longitude)
      );
    }

    // 기존 마커 제거
    if (gymMarkerRef.current) {
      gymMarkerRef.current.setMap(null);
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    // 헬스장 마커 생성
    gymMarkerRef.current = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(gym.latitude, gym.longitude),
      map: mapInstanceRef.current,
      title: gym.name,
      icon: {
        content: `
          <div style="
            width: 40px;
            height: 40px;
            background-color: oklch(0.62 0.10 35);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
          ">🏋️</div>
        `,
        anchor: new window.naver.maps.Point(20, 20),
      },
    });

    // 사용자 위치 마커 생성 (있는 경우)
    if (userLocation) {
      userMarkerRef.current = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(userLocation.lat, userLocation.lng),
        map: mapInstanceRef.current,
        title: '내 위치',
        icon: {
          content: `
            <div style="
              width: 30px;
              height: 30px;
              background-color: oklch(0.62 0.10 35);
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>
          `,
          anchor: new window.naver.maps.Point(15, 15),
        },
      });
    }
  }, [gym, userLocation, isLoading, error]);

  /**
   * 네이버맵 길찾기 버튼 클릭 핸들러
   */
  const handleDirections = () => {
    const destCoords = `${gym.longitude},${gym.latitude}`;
    const startCoords = userLocation ? `${userLocation.lng},${userLocation.lat}` : '';

    const naverMapUrl = startCoords
      ? `https://map.naver.com/v5/directions/${startCoords}/${destCoords}`
      : `https://map.naver.com/v5/search/${encodeURIComponent(gym.address)}`;

    window.open(naverMapUrl, '_blank');
  };

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-foreground">위치</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-foreground">위치</h2>
        <div className="w-full h-[60vh] md:h-[400px] rounded-lg bg-secondary flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.5} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-foreground">위치</h2>

      {/* 지도 */}
      <div
        ref={mapRef}
        className="w-full h-[60vh] md:h-[400px] rounded-lg mb-4 bg-secondary border border-border"
        style={{ minHeight: '300px' }}
      />

      {/* 길찾기 버튼 */}
      <Button
        onClick={handleDirections}
        className="w-full bg-primary hover:bg-primary-hover text-white"
      >
        <Navigation className="mr-2 h-4 w-4" strokeWidth={1.5} />
        네이버맵 길찾기
      </Button>
    </Card>
  );
}

