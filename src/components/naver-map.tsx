"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    naver: any;
  }
}

export default function NaverMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

    if (!clientId) {
      console.error("NEXT_PUBLIC_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다.");
      return;
    }

    const initMap = () => {
      if (!mapRef.current || !window.naver) return;

      new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(37.5665, 126.978),
        zoom: 14,
      });
      setIsLoaded(true);
    };

    // 이미 로드되었으면 바로 초기화
    if (window.naver) {
      initMap();
      return;
    }

    const scriptId = "naver-map-script";
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      // 스크립트가 이미 있으면 로드 완료 대기
      existingScript.addEventListener("load", initMap);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = initMap;
    script.onerror = () => console.error("네이버 지도 스크립트 로드 실패");

    document.head.appendChild(script);
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "400px" }}
      className="rounded-xl bg-muted"
    >
      {!isLoaded && (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">지도 로딩 중...</p>
        </div>
      )}
    </div>
  );
}
