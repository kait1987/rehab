/**
 * @file gym-search.service.ts
 * @description 헬스장 검색 서비스
 * 
 * 우리 DB(gyms, gym_facilities)의 정보를 기반으로 반경 내 헬스장을 검색하고 필터링합니다.
 * 
 * 주요 기능:
 * 1. 좌표 범위 계산을 통한 DB 스캔 범위 최적화
 * 2. Haversine 공식을 사용한 정확한 거리 계산
 * 3. 필터링 조건 적용 (조용한 곳, 재활기구, 주차 등)
 * 4. 거리순 정렬
 * 
 * @dependencies
 * - @prisma/client: DB 조회
 * - lib/utils/calculate-distance: 거리 계산
 * - lib/utils/calculate-bounding-box: 좌표 범위 계산
 */

import { prisma } from '@/lib/prisma/client';
import { calculateDistance } from '@/lib/utils/calculate-distance';
import { calculateBoundingBox } from '@/lib/utils/calculate-bounding-box';
import type {
  GymSearchRequest,
  GymSearchFilter,
  GymSearchResult,
} from '@/types/gym-search';
import type { OperatingHours } from '@/types/operating-hours';

/**
 * 헬스장 검색 서비스
 */
export class GymSearchService {
  /**
   * 반경 내 헬스장 검색
   * 
   * 좌표 범위 계산을 통한 DB 스캔 최적화와 Haversine 공식을 사용한 정확한 거리 계산을 수행합니다.
   * 
   * @param request 검색 요청
   * @returns 검색 결과 목록 (거리순 정렬)
   */
  async searchGymsNearby(request: GymSearchRequest): Promise<GymSearchResult[]> {
    const { lat, lng, radius = 1000, filters } = request;

    // 1. 좌표 범위 계산 (DB 쿼리 최적화)
    const bbox = calculateBoundingBox(lat, lng, radius);

    // 2. Prisma 쿼리 조건 구성
    const whereConditions: any = {
      latitude: {
        gte: bbox.minLat,
        lte: bbox.maxLat,
      },
      longitude: {
        gte: bbox.minLng,
        lte: bbox.maxLng,
      },
      isActive: true,
    };

    // 3. 필터 조건 추가
    if (filters) {
      // facilities 관계 필터링을 위한 조건
      const facilityConditions: any = {};

      if (filters.isQuiet !== undefined) {
        facilityConditions.isQuiet = filters.isQuiet;
      }
      if (filters.hasRehabEquipment !== undefined) {
        facilityConditions.hasRehabEquipment = filters.hasRehabEquipment;
      }
      if (filters.hasPtCoach !== undefined) {
        facilityConditions.hasPtCoach = filters.hasPtCoach;
      }
      if (filters.hasShower !== undefined) {
        facilityConditions.hasShower = filters.hasShower;
      }
      if (filters.hasParking !== undefined) {
        facilityConditions.hasParking = filters.hasParking;
      }
      if (filters.hasLocker !== undefined) {
        facilityConditions.hasLocker = filters.hasLocker;
      }

      // facilities 필터가 있으면 facilities 관계 조건 추가
      if (Object.keys(facilityConditions).length > 0) {
        whereConditions.facilities = facilityConditions;
      }

      // priceRange 필터
      if (filters.priceRange !== undefined) {
        whereConditions.priceRange = filters.priceRange;
      }
    }

    // 4. DB 조회 (facilities, operatingHours 관계 포함)
    const gyms = await prisma.gym.findMany({
      where: whereConditions,
      include: {
        facilities: true,
        operatingHours: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
      },
    });

    // 5. 정확한 거리 계산 및 반경 필터링
    const results: GymSearchResult[] = [];

    for (const gym of gyms) {
      // Prisma Decimal을 number로 변환
      const gymLat = Number(gym.latitude);
      const gymLng = Number(gym.longitude);

      // Haversine 공식으로 정확한 거리 계산
      const distanceMeters = calculateDistance(lat, lng, gymLat, gymLng);

      // 반경 내 헬스장만 포함
      if (distanceMeters <= radius) {
        // facilities가 없으면 기본값 생성
        const facilities = gym.facilities || {
          isQuiet: false,
          hasRehabEquipment: false,
          hasPtCoach: false,
          hasShower: false,
          hasParking: false,
          hasLocker: false,
          hasWaterDispenser: false,
          hasAirConditioning: false,
          otherFacilities: [],
        };

        // operatingHours 변환
        const operatingHours: OperatingHours[] = gym.operatingHours.map((oh) => ({
          dayOfWeek: oh.dayOfWeek as OperatingHours['dayOfWeek'],
          openTime: oh.openTime || undefined,
          closeTime: oh.closeTime || undefined,
          isClosed: oh.isClosed,
          notes: oh.notes || undefined,
        }));

        results.push({
          id: gym.id,
          name: gym.name,
          address: gym.address,
          latitude: gymLat,
          longitude: gymLng,
          phone: gym.phone || undefined,
          website: gym.website || undefined,
          priceRange: gym.priceRange || undefined,
          description: gym.description || undefined,
          distanceMeters,
          facilities: {
            isQuiet: facilities.isQuiet,
            hasRehabEquipment: facilities.hasRehabEquipment,
            hasPtCoach: facilities.hasPtCoach,
            hasShower: facilities.hasShower,
            hasParking: facilities.hasParking,
            hasLocker: facilities.hasLocker,
            hasWaterDispenser: facilities.hasWaterDispenser,
            hasAirConditioning: facilities.hasAirConditioning,
            otherFacilities: facilities.otherFacilities,
          },
          operatingHours: operatingHours.length > 0 ? operatingHours : undefined,
          isActive: gym.isActive,
        });
      }
    }

    // 6. 거리순 정렬
    results.sort((a, b) => a.distanceMeters - b.distanceMeters);

    return results;
  }
}

/**
 * GymSearchService 싱글톤 인스턴스
 */
let gymSearchServiceInstance: GymSearchService | null = null;

/**
 * GymSearchService 인스턴스 가져오기
 * 
 * @returns GymSearchService 인스턴스
 */
export function getGymSearchService(): GymSearchService {
  if (!gymSearchServiceInstance) {
    gymSearchServiceInstance = new GymSearchService();
  }
  return gymSearchServiceInstance;
}

