/**
 * @file gym-search.service.ts
 * @description 헬스장 검색 서비스 (하이브리드 검색 전략)
 * 
 * 하이브리드 검색 전략을 사용하여 반경 내 헬스장을 검색합니다.
 * 
 * 주요 기능:
 * 1. DB 검색 (1단계): 우리 DB에서 반경 내 헬스장 조회
 * 2. API Fallback (2단계): DB 결과가 부족하면 네이버 API로 실시간 검색
 * 3. Upsert (3단계): API 결과를 백그라운드에서 DB에 저장/업데이트
 * 4. 통합 및 중복 제거: DB 결과와 API 결과를 통합하여 반환
 * 
 * @dependencies
 * - @prisma/client: DB 조회 및 Upsert
 * - lib/utils/calculate-distance: 거리 계산
 * - lib/utils/calculate-bounding-box: 좌표 범위 계산
 * - lib/services/place-search.service: 네이버 API 검색
 * - lib/utils/convert-place-to-gym: PlaceItem → Gym 변환
 */

import { prisma } from '@/lib/prisma/client';
import { calculateDistance } from '@/lib/utils/calculate-distance';
import { calculateBoundingBox } from '@/lib/utils/calculate-bounding-box';
import { getPlaceSearchService } from '@/lib/services/place-search.service';
import {
  convertPlaceItemToGymAllData,
  type GymUpsertData,
  type GymFacilityUpsertData,
  type GymOperatingHourUpsertData,
} from '@/lib/utils/convert-place-to-gym';
import { normalizePlaceItem } from '@/lib/utils/normalize-place-item';
import type {
  GymSearchRequest,
  GymSearchFilter,
  GymSearchResult,
} from '@/types/gym-search';
import type { OperatingHours } from '@/types/operating-hours';
import type { PlaceItem } from '@/types/naver-map';

/**
 * 헬스장 검색 서비스
 */
export class GymSearchService {
  /**
   * 반경 내 헬스장 검색 (하이브리드 전략)
   * 
   * 1단계: DB 검색 → 2단계: API Fallback → 3단계: Upsert (백그라운드) → 4단계: 통합
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

    // 7. 하이브리드 검색: DB 결과가 3개 미만이면 API Fallback
    if (results.length < 3) {
      const apiResults = await this.searchFromAPI(request);
      
      // 8. API 결과를 백그라운드에서 Upsert (비동기, 에러 무시)
      this.upsertGymsFromAPIResults(apiResults).catch((error) => {
        console.error('[GymSearchService] Upsert 실패 (무시됨):', error);
      });

      // 9. API 결과를 GymSearchResult로 변환
      const apiGymResults = this.convertPlaceItemsToGymSearchResults(
        apiResults,
        request.lat,
        request.lng
      );

      // 10. 중복 제거 및 통합 (DB 결과 우선)
      const mergedResults = this.mergeAndDeduplicateResults(results, apiGymResults);

      return mergedResults;
    }

    return results;
  }

  /**
   * 네이버 API로 헬스장 검색 (Fallback)
   * 
   * @param request 검색 요청
   * @returns PlaceItem 배열 (거리 정보 포함)
   */
  private async searchFromAPI(
    request: GymSearchRequest
  ): Promise<Array<PlaceItem & { distanceMeters: number }>> {
    const placeSearchService = getPlaceSearchService();
    
    try {
      const results = await placeSearchService.searchGymsNearbyMultipleKeywords(
        request.lat,
        request.lng,
        {
          maxResults: 20, // 최대 20개까지 가져오기
          sortBy: 'distance',
        }
      );

      // normalizePlaceItem으로 정규화 (운영시간 파싱 포함)
      // distanceMeters는 유지해야 하므로 별도로 처리
      const normalizedResults: Array<PlaceItem & { distanceMeters: number }> = results.map((item) => {
        try {
          const normalized = normalizePlaceItem(item, {
            parseOperatingHours: true,
            validate: true,
          });
          // distanceMeters 유지
          return {
            ...normalized,
            distanceMeters: item.distanceMeters,
          };
        } catch (error) {
          console.warn('[GymSearchService] PlaceItem 정규화 실패:', error);
          // 정규화 실패 시 원본 반환 (distanceMeters 포함)
          return item;
        }
      });

      return normalizedResults;
    } catch (error) {
      console.error('[GymSearchService] API 검색 실패:', error);
      return [];
    }
  }

  /**
   * PlaceItem 배열을 GymSearchResult 배열로 변환
   * 
   * @param placeItems PlaceItem 배열
   * @param centerLat 중심 좌표 위도
   * @param centerLng 중심 좌표 경도
   * @returns GymSearchResult 배열
   */
  private convertPlaceItemsToGymSearchResults(
    placeItems: Array<PlaceItem & { distanceMeters: number }>,
    centerLat: number,
    centerLng: number
  ): GymSearchResult[] {
    const results: GymSearchResult[] = [];

    for (const placeItem of placeItems) {
      // 좌표 확인
      if (placeItem.lat === undefined || placeItem.lng === undefined) {
        continue;
      }

      // 거리 재계산 (정확도 향상)
      const distanceMeters = calculateDistance(
        centerLat,
        centerLng,
        placeItem.lat,
        placeItem.lng
      );

      results.push({
        id: `api_${placeItem.title}_${placeItem.address}`, // 임시 ID (DB에 저장되면 실제 ID로 교체)
        name: placeItem.title,
        address: placeItem.address,
        latitude: placeItem.lat,
        longitude: placeItem.lng,
        phone: placeItem.telephone || undefined,
        website: placeItem.link || undefined,
        priceRange: undefined, // 네이버 API에서 제공하지 않음
        description: placeItem.description || undefined,
        distanceMeters,
        facilities: {
          isQuiet: false,
          hasRehabEquipment: false,
          hasPtCoach: false,
          hasShower: false,
          hasParking: false,
          hasLocker: false,
          hasWaterDispenser: false,
          hasAirConditioning: false,
          otherFacilities: [],
        },
        operatingHours: placeItem.operatingHours,
        isActive: true,
      });
    }

    return results;
  }

  /**
   * DB 결과와 API 결과를 중복 제거하여 통합
   * 
   * 중복 판단 기준: name + address 조합
   * DB 결과 우선 (더 정확한 정보)
   * 
   * @param dbResults DB 검색 결과
   * @param apiResults API 검색 결과
   * @returns 통합된 결과 (중복 제거, 거리순 정렬)
   */
  private mergeAndDeduplicateResults(
    dbResults: GymSearchResult[],
    apiResults: GymSearchResult[]
  ): GymSearchResult[] {
    const resultMap = new Map<string, GymSearchResult>();

    // 1. DB 결과 먼저 추가 (우선순위 높음)
    for (const result of dbResults) {
      const key = `${result.name}|${result.address}`;
      resultMap.set(key, result);
    }

    // 2. API 결과 추가 (중복되지 않는 것만)
    for (const result of apiResults) {
      const key = `${result.name}|${result.address}`;
      if (!resultMap.has(key)) {
        resultMap.set(key, result);
      }
    }

    // 3. 거리순 정렬
    const mergedResults = Array.from(resultMap.values());
    mergedResults.sort((a, b) => a.distanceMeters - b.distanceMeters);

    return mergedResults;
  }

  /**
   * API 검색 결과를 DB에 Upsert (백그라운드)
   * 
   * 비동기로 실행되며, 에러가 발생해도 사용자 응답에는 영향을 주지 않습니다.
   * 
   * @param placeItems PlaceItem 배열
   */
  private async upsertGymsFromAPIResults(
    placeItems: Array<PlaceItem & { distanceMeters: number }>
  ): Promise<void> {
    for (const placeItem of placeItems) {
      try {
        // PlaceItem을 Gym 데이터로 변환
        const { gym, facility, operatingHours } = convertPlaceItemToGymAllData(placeItem);

        // Gym Upsert (name + address로 기존 레코드 찾기)
        const existingGymId = await this.findGymByNameAndAddress(gym.name, gym.address);
        
        let upsertedGym;
        if (existingGymId) {
          // 기존 레코드 업데이트
          upsertedGym = await prisma.gym.update({
            where: {
              id: existingGymId,
            },
            data: {
              ...gym,
              lastUpdatedAt: new Date(),
            },
          });
        } else {
          // 새 레코드 생성
          upsertedGym = await prisma.gym.create({
            data: gym,
          });
        }

        // GymFacility Upsert
        await prisma.gymFacility.upsert({
          where: {
            gymId: upsertedGym.id,
          },
          update: facility,
          create: {
            ...facility,
            gymId: upsertedGym.id,
          },
        });

        // GymOperatingHour UpsertMany
        // Prisma는 composite unique를 gymId_dayOfWeek 형식으로 사용
        if (operatingHours.length > 0) {
          await Promise.all(
            operatingHours.map((oh) =>
              prisma.gymOperatingHour.upsert({
                where: {
                  gymId_dayOfWeek: {
                    gymId: upsertedGym.id,
                    dayOfWeek: oh.dayOfWeek,
                  },
                },
                update: oh,
                create: {
                  ...oh,
                  gymId: upsertedGym.id,
                },
              })
            )
          );
        }
      } catch (error) {
        console.error(
          `[GymSearchService] Upsert 실패 (${placeItem.title}):`,
          error
        );
        // 개별 Upsert 실패는 무시하고 계속 진행
      }
    }
  }

  /**
   * name과 address로 기존 Gym 찾기
   * 
   * @param name 헬스장 이름
   * @param address 주소
   * @returns Gym ID 또는 null
   */
  private async findGymByNameAndAddress(
    name: string,
    address: string
  ): Promise<string | null> {
    const gym = await prisma.gym.findFirst({
      where: {
        name,
        address,
      },
      select: {
        id: true,
      },
    });

    return gym?.id || null;
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

