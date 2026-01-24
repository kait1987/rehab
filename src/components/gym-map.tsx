/**
 * @file gym-map.tsx
 * @description 헬스장 지도 컴포넌트
 *
 * 네이버 지도 API v3를 사용하여 헬스장 위치를 지도에 표시합니다.
 *
 * 주요 기능:
 * - 네이버 지도 API v3 스크립트 동적 로드
 * - 헬스장 마커 표시 (운영 상태별 색상 구분)
 * - 마커 클릭 시 InfoWindow 표시
 * - 현재 위치 마커 표시
 * - 지도 중심점 자동 설정
 *
 * @dependencies
 * - 네이버 지도 API v3: https://navermaps.github.io/maps.js.ncp/
 * - @/types/gym-search: GymSearchResult 타입
 * - @/lib/utils/check-business-status: 영업 상태 확인
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { getBusinessStatus } from "@/lib/utils/check-business-status";
import type { GymSearchResult } from "@/types/gym-search";
import "@/types/naver-maps";
import { useEffect, useRef, useState } from "react";

interface GymMapProps {
  /** 표시할 헬스장 목록 */
  gyms: GymSearchResult[];
  /** 지도 중심 좌표 */
  center: { lat: number; lng: number } | null;
  /** 현재 위치 좌표 (선택) */
  userLocation?: { lat: number; lng: number } | null;
  /** 마커 클릭 핸들러 (선택) */
  onMarkerClick?: (gym: GymSearchResult) => void;
}

/**
 * 마커 색상 결정 (운영 상태별)
 */
function getMarkerColor(gym: GymSearchResult): string {
  if (!gym.operatingHours || gym.operatingHours.length === 0) {
    return "#FCD34D"; // 노란색 (정보 없음)
  }

  const status = getBusinessStatus(gym.operatingHours);
  if (status.isOpen) {
    return "#10B981"; // 초록색 (운영중)
  } else {
    return "#6B7280"; // 회색 (휴무)
  }
}

/**
 * 헬스장 지도 컴포넌트
 */
export function GymMap({
  gyms,
  center,
  userLocation,
  onMarkerClick,
}: GymMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 네이버맵 스크립트 로드
   */
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

    if (!clientId) {
      setError("네이버맵 API 키가 설정되지 않았습니다.");
      setIsLoading(false);
      return;
    }

    // 이미 로드되었으면 중복 로딩 방지
    if (window.naver) {
      setIsLoading(false);
      return;
    }

    const scriptId = "naver-map-script";

    // 이미 스크립트가 있으면 제거
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;

    script.onload = () => {
      if (!window.naver) {
        setError("네이버 지도 API를 로드할 수 없습니다.");
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    };

    script.onerror = () => {
      setError("네이버 지도 스크립트를 로드하는 중 오류가 발생했습니다.");
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트는 유지 (다른 컴포넌트에서 사용할 수 있음)
    };
  }, []);

  /**
   * 지도 초기화 및 마커 표시
   */
  useEffect(() => {
    if (isLoading || error || !window.naver || !mapRef.current) {
      return;
    }

    if (!center) {
      return;
    }

    // 지도 초기화
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(center.lat, center.lng),
        zoom: 15,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
        },
      });
    } else {
      // 중심점 업데이트
      mapInstanceRef.current.setCenter(
        new window.naver.maps.LatLng(center.lat, center.lng),
      );
    }

    const map = mapInstanceRef.current;

    // 기존 마커 제거
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // 기존 InfoWindow 닫기
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    // 헬스장 마커 생성
    gyms.forEach((gym) => {
      if (!gym.latitude || !gym.longitude) {
        return;
      }

      const markerColor = getMarkerColor(gym);
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(gym.latitude, gym.longitude),
        map: map,
        icon: {
          content: `
            <div style="
              width: 32px;
              height: 32px;
              background-color: ${markerColor};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 12px;
                height: 12px;
                background-color: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
          anchor: new window.naver.maps.Point(16, 16),
        },
        title: gym.name,
      });

      // 마커 클릭 이벤트
      window.naver.maps.Event.addListener(marker, "click", () => {
        // 기존 InfoWindow 닫기
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }

        // InfoWindow 생성
        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="
              padding: 12px;
              min-width: 200px;
              max-width: 300px;
              font-family: system-ui, -apple-system, sans-serif;
            ">
              <h3 style="
                margin: 0 0 8px 0;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
              ">${gym.name}</h3>
              <p style="
                margin: 0 0 4px 0;
                font-size: 14px;
                color: #6b7280;
              ">${gym.address}</p>
              ${
                gym.phone
                  ? `
                <p style="
                  margin: 0 0 8px 0;
                  font-size: 14px;
                  color: #6b7280;
                ">📞 ${gym.phone}</p>
              `
                  : ""
              }
              <div style="
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid #e5e7eb;
              ">
                <a href="/gyms/${gym.id}" style="
                  display: inline-block;
                  padding: 6px 12px;
                  background-color: #E76F51;
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                  font-size: 14px;
                  font-weight: 500;
                ">상세보기</a>
              </div>
            </div>
          `,
          backgroundColor: "#ffffff",
          borderColor: "#e5e7eb",
          borderWidth: 1,
          anchorSize: new window.naver.maps.Size(10, 10),
          pixelOffset: new window.naver.maps.Point(0, -10),
        });

        infoWindow.open(map, marker);
        infoWindowRef.current = infoWindow;

        // 외부 클릭 핸들러 호출
        if (onMarkerClick) {
          onMarkerClick(gym);
        }
      });

      markersRef.current.push(marker);
    });

    // 현재 위치 마커 표시
    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }

      userMarkerRef.current = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          userLocation.lat,
          userLocation.lng,
        ),
        map: map,
        icon: {
          content: `
            <div style="
              width: 40px;
              height: 40px;
              background-color: #E76F51;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 16px;
                height: 16px;
                background-color: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
          anchor: new window.naver.maps.Point(20, 20),
        },
        title: "내 위치",
        zIndex: 1000, // 다른 마커 위에 표시
      });
    }
  }, [gyms, center, userLocation, isLoading, error, onMarkerClick]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center h-[60vh] sm:h-[65vh] md:h-[70vh] bg-muted rounded-xl border border-border"
        style={{ minHeight: "400px", maxHeight: "800px" }}
      >
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-2">{error}</p>
          <p className="text-sm text-muted-foreground/80">
            리스트 뷰로 전환해주세요.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-[60vh] sm:h-[65vh] md:h-[70vh] bg-muted rounded-xl border border-border"
        style={{ minHeight: "400px", maxHeight: "800px" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-[60vh] sm:h-[65vh] md:h-[70vh] rounded-xl overflow-hidden border border-border"
      style={{ minHeight: "400px", maxHeight: "800px" }}
    />
  );
}
