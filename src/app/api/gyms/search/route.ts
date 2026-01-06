/**
 * @file route.ts
 * @description 헬스장 검색 API 엔드포인트
 * 
 * GET /api/gyms/search
 * 
 * 반경 내 헬스장을 검색하고 필터링하여 반환합니다.
 * 
 * 쿼리 파라미터:
 * - lat (필수): 중심 좌표 위도
 * - lng (필수): 중심 좌표 경도
 * - radius (선택): 검색 반경 (미터, 기본값: 1000m = 1km)
 * - 필터 옵션 (모두 선택):
 *   - isQuiet: 조용한 분위기 (boolean)
 *   - hasRehabEquipment: 재활 기구 구비 (boolean)
 *   - hasPtCoach: PT/재활 코치 여부 (boolean)
 *   - hasShower: 샤워실 (boolean)
 *   - hasParking: 주차 (boolean)
 *   - hasLocker: 락커 (boolean)
 *   - priceRange: 가격대 ('low' | 'medium' | 'high' | 'premium')
 * 
 * @dependencies
 * - lib/services/gym-search.service: 헬스장 검색 서비스
 * - lib/validations/gym-search.schema: 요청 검증 스키마
 */

import { NextRequest, NextResponse } from 'next/server';
import { gymSearchRequestSchema } from '@/lib/validations/gym-search.schema';
import { getGymSearchService } from '@/lib/services/gym-search.service';
import type { GymSearchResponse } from '@/types/gym-search';

/**
 * GET 요청 처리
 * 
 * 헬스장 검색 요청을 처리하고 결과를 반환합니다.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const radiusParam = searchParams.get('radius');

    // 2. 필수 파라미터 검증
    if (!latParam || !lngParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'lat와 lng 파라미터는 필수입니다.',
        } as GymSearchResponse,
        { status: 400 }
      );
    }

    // 3. 숫자 변환 및 기본값 설정
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    const radius = radiusParam ? parseFloat(radiusParam) : undefined;

    // 4. 필터 옵션 추출
    const filters: any = {};
    const isQuietParam = searchParams.get('isQuiet');
    const hasRehabEquipmentParam = searchParams.get('hasRehabEquipment');
    const hasPtCoachParam = searchParams.get('hasPtCoach');
    const hasShowerParam = searchParams.get('hasShower');
    const hasParkingParam = searchParams.get('hasParking');
    const hasLockerParam = searchParams.get('hasLocker');
    const priceRangeParam = searchParams.get('priceRange');

    if (isQuietParam !== null) {
      filters.isQuiet = isQuietParam === 'true';
    }
    if (hasRehabEquipmentParam !== null) {
      filters.hasRehabEquipment = hasRehabEquipmentParam === 'true';
    }
    if (hasPtCoachParam !== null) {
      filters.hasPtCoach = hasPtCoachParam === 'true';
    }
    if (hasShowerParam !== null) {
      filters.hasShower = hasShowerParam === 'true';
    }
    if (hasParkingParam !== null) {
      filters.hasParking = hasParkingParam === 'true';
    }
    if (hasLockerParam !== null) {
      filters.hasLocker = hasLockerParam === 'true';
    }
    if (priceRangeParam !== null) {
      filters.priceRange = priceRangeParam;
    }

    // 5. Zod 스키마로 검증
    const validationResult = gymSearchRequestSchema.safeParse({
      lat,
      lng,
      radius,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `요청 파라미터 검증 실패: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
        } as GymSearchResponse,
        { status: 400 }
      );
    }

    // 6. 검색 서비스 호출
    const searchService = getGymSearchService();
    const results = await searchService.searchGymsNearby(validationResult.data);

    // 7. 응답 반환
    const response: GymSearchResponse = {
      success: true,
      data: results,
      meta: {
        total: results.length,
        radius: validationResult.data.radius,
        filters: validationResult.data.filters || {},
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[GymSearchAPI] 에러 발생:', error);

    // 에러 타입에 따라 다른 응답
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: `서버 에러: ${error.message}`,
        } as GymSearchResponse,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: '알 수 없는 서버 에러가 발생했습니다.',
      } as GymSearchResponse,
      { status: 500 }
    );
  }
}

