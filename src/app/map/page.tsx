"use client";

import { useEffect } from "react";

export default function MapPage() {
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    const scriptUrl = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;

    // ncpClientId 값 확인
    console.log("🔍 [네이버 지도] ncpClientId 값 확인:");
    console.log("  - NEXT_PUBLIC_NAVER_MAP_CLIENT_ID:", clientId);
    console.log("  - 스크립트 URL:", scriptUrl);
    console.log("  - ncpClientId 파라미터:", clientId || "undefined");

    const scriptId = "naver-map-script";

    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = scriptUrl;
    script.async = true;

    script.onload = () => {
      if (!window.naver) {
        console.error("❌ window.naver 없음");
        return;
      }

      const map = new window.naver.maps.Map("map", {
        center: new window.naver.maps.LatLng(37.5665, 126.978),
        zoom: 10,
      });

      console.log("✅ 지도 초기화 성공", map);
    };

    script.onerror = () => {
      console.error("❌ 네이버 지도 스크립트 로드 실패");
    };

    document.head.appendChild(script);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>네이버 지도 테스트</h1>
      <div
        id="map"
        style={{ width: "100%", height: "500px", background: "#eee" }}
      />
    </div>
  );
}
