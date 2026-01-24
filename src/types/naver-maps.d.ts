/* eslint-disable @typescript-eslint/no-explicit-any */
export {};

/**
 * Naver Maps SDK Types
 * 네이버 지도 API v3 타입 정의
 *
 * 이 파일은 네이버 맵 SDK의 타입을 정의합니다.
 * SDK가 동적으로 로드되므로 any 타입을 허용합니다.
 */
declare global {
  interface Window {
    naver: {
      maps: {
        Map: any;
        LatLng: any;
        Marker: any;
        InfoWindow: any;
        Event: {
          addListener: (
            target: any,
            eventName: string,
            handler: (...args: any[]) => void,
          ) => void;
          removeListener: (listener: any) => void;
        };
        Position: {
          TOP_LEFT: number;
          TOP_CENTER: number;
          TOP_RIGHT: number;
          LEFT_CENTER: number;
          CENTER: number;
          RIGHT_CENTER: number;
          BOTTOM_LEFT: number;
          BOTTOM_CENTER: number;
          BOTTOM_RIGHT: number;
        };
        Point: any;
        Size: any;
      };
    };
  }
}
