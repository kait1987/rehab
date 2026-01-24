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

/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma/client";
import { getPlaceSearchService } from "@/lib/services/place-search.service";
import { calculateBoundingBox } from "@/lib/utils/calculate-bounding-box";
import { calculateDistance } from "@/lib/utils/calculate-distance";
import { convertPlaceItemToGymAllData } from "@/lib/utils/convert-place-to-gym";
import { normalizePlaceItem } from "@/lib/utils/normalize-place-item";
import type {
  GymSearchFilter,
  GymSearchRequest,
  GymSearchResult,
} from "@/types/gym-search";
import type { PlaceItem } from "@/types/naver-map";
import type { OperatingHours } from "@/types/operating-hours";

/**
 * 헬스장 검색 서비스
 */
export class GymSearchService {
  /**
   * 반경 내 헬스장 검색 (하이브리드 전략 + Full Text Search)
   *
   * Phase 3.2: Full Text Search 통합
   * - 검색어(query)가 있으면 Full Text Search 우선 사용
   * - 검색어가 없으면 기존 위치 기반 검색 사용
   *
   * 1단계: DB 검색 (FTS 또는 위치 기반) → 2단계: API Fallback → 3단계: Upsert (백그라운드) → 4단계: 통합
   *
   * @param request 검색 요청
   * @returns 검색 결과 목록 (검색어 있으면 관련도순, 없으면 거리순 정렬)
   */
  async searchGymsNearby(
    request: GymSearchRequest,
  ): Promise<GymSearchResult[]> {
    const { lat, lng, radius = 1000, query, filters } = request;

    // 1. 좌표 범위 계산 (DB 쿼리 최적화)
    const bbox = calculateBoundingBox(lat, lng, radius);

    let gyms: Array<{
      id: string;
      name: string;
      address: string;
      latitude: any; // Prisma Decimal
      longitude: any; // Prisma Decimal
      phone: string | null;
      website: string | null;
      priceRange: string | null;
      description: string | null;
      isActive: boolean;
      facilities: any;
      operatingHours: any[];
      ftsRank?: number; // Full Text Search 관련도 점수
    }> = [];

    // 2. 검색어가 있으면 Full Text Search 사용, 없으면 기존 위치 기반 검색
    if (query && query.trim().length > 0) {
      // Full Text Search 사용
      gyms = await this.searchWithFullTextSearch(query, bbox, filters);
    } else {
      // 기존 위치 기반 검색 사용
      gyms = await this.searchByLocation(bbox, filters);
    }

    // 3. 정확한 거리 계산 및 반경 필터링
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
          hasRehabEquipment: false,
          hasPtCoach: false,
          hasShower: false,
          hasParking: false,
          hasLocker: false,
          otherFacilities: [],
        };

        // operatingHours 변환
        const operatingHours: OperatingHours[] = gym.operatingHours.map(
          (oh) => ({
            dayOfWeek: oh.dayOfWeek as OperatingHours["dayOfWeek"],
            openTime: oh.openTime || null,
            closeTime: oh.closeTime || null,
            isClosed: oh.isClosed,
            notes: oh.notes || null,
          }),
        );

        const result: GymSearchResult & { ftsRank?: number } = {
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
            hasRehabEquipment: facilities.hasRehabEquipment,
            hasPtCoach: facilities.hasPtCoach,
            hasShower: facilities.hasShower,
            hasParking: facilities.hasParking,
            hasLocker: facilities.hasLocker,
            otherFacilities: facilities.otherFacilities || [],
          },
          operatingHours:
            operatingHours.length > 0 ? operatingHours : undefined,
          isActive: gym.isActive,
        };

        // FTS 관련도 점수 추가 (정렬용, 최종 결과에는 포함하지 않음)
        if ("ftsRank" in gym && gym.ftsRank !== undefined) {
          (result as any).ftsRank = gym.ftsRank;
        }

        results.push(result);
      }
    }

    // 4. 정렬 (검색어 있으면 관련도순, 없으면 거리순)
    if (query && query.trim().length > 0) {
      // Full Text Search 결과는 관련도(ftsRank) 우선, 그 다음 거리순
      results.sort((a, b) => {
        const aRank = (a as any).ftsRank || 0;
        const bRank = (b as any).ftsRank || 0;
        if (bRank !== aRank) {
          return bRank - aRank; // 관련도 높은 순
        }
        return a.distanceMeters - b.distanceMeters; // 거리순
      });

      // ftsRank 제거 (최종 결과에는 포함하지 않음)
      results.forEach((result) => {
        delete (result as any).ftsRank;
      });
    } else {
      // 거리순 정렬
      results.sort((a, b) => a.distanceMeters - b.distanceMeters);
    }

    // 5. 하이브리드 검색: DB 결과가 3개 미만이면 API Fallback
    if (results.length < 3) {
      const apiResults = await this.searchFromAPI(request);

      // 8. API 결과를 백그라운드에서 Upsert (비동기, 에러 무시)
      this.upsertGymsFromAPIResults(apiResults).catch((error) => {
        console.error("[GymSearchService] Upsert 실패 (무시됨):", error);
      });

      // 9. API 결과를 GymSearchResult로 변환
      const apiGymResults = this.convertPlaceItemsToGymSearchResults(
        apiResults,
        request.lat,
        request.lng,
      );

      // 10. 중복 제거 및 통합 (DB 결과 우선)
      const mergedResults = this.mergeAndDeduplicateResults(
        results,
        apiGymResults,
      );

      return mergedResults;
    }

    return results;
  }

  /**
   * 키워드 검색을 사용한 헬스장 검색
   *
   * 검색어가 있을 때 사용하는 LIKE 검색 로직
   * - name, address, description 필드에서 검색어 포함 여부 확인
   * - 전문 검색 기능이 구현되면 Full Text Search로 업그레이드 예정
   *
   * @param query 검색어
   * @param bbox 좌표 범위
   * @param filters 필터 옵션
   * @returns 헬스장 배열 (ftsRank 포함, 현재는 0으로 설정)
   */
  private async searchWithFullTextSearch(
    query: string,
    bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number },
    filters?: GymSearchFilter,
  ) {
    // 검색어 정규화 (공백 제거)
    const normalizedQuery = query.trim();
    const searchPattern = `%${normalizedQuery}%`;

    // Prisma $queryRaw를 사용하여 LIKE 검색 쿼리 실행
    // 템플릿 리터럴 방식을 사용하여 Prisma가 자동으로 파라미터 바인딩 처리 (SQL Injection 방지)
    const ftsResults = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        address: string;
        latitude: any;
        longitude: any;
        phone: string | null;
        website: string | null;
        price_range: string | null;
        description: string | null;
        is_active: boolean;
        fts_rank: number;
      }>
    >`
      SELECT
        g.id,
        g.name,
        g.address,
        g.latitude,
        g.longitude,
        g.phone,
        g.website,
        g.price_range,
        g.description,
        g.is_active,
        1 as fts_rank
      FROM public.gyms g
      WHERE
        (g.name ILIKE ${searchPattern}
         OR g.address ILIKE ${searchPattern}
         OR g.description ILIKE ${searchPattern})
        AND g.latitude >= ${bbox.minLat}
        AND g.latitude <= ${bbox.maxLat}
        AND g.longitude >= ${bbox.minLng}
        AND g.longitude <= ${bbox.maxLng}
        AND g.is_active = true
      ORDER BY 
        CASE 
          WHEN g.name ILIKE ${searchPattern} THEN 1
          WHEN g.address ILIKE ${searchPattern} THEN 2
          ELSE 3
        END,
        g.name
      LIMIT 50
    `;

    // Prisma 관계 데이터 로드 (facilities, operatingHours)
    const gymIds = ftsResults.map((g) => g.id);

    if (gymIds.length === 0) {
      return [];
    }

    // 필터 조건 구성
    const whereConditions: any = {
      id: { in: gymIds },
    };

    // facilities 필터 추가
    if (filters) {
      const facilityConditions: any = {};
      if (filters.hasRehabEquipment !== undefined)
        facilityConditions.hasRehabEquipment = filters.hasRehabEquipment;
      if (filters.hasPtCoach !== undefined)
        facilityConditions.hasPtCoach = filters.hasPtCoach;
      if (filters.hasShower !== undefined)
        facilityConditions.hasShower = filters.hasShower;
      if (filters.hasParking !== undefined)
        facilityConditions.hasParking = filters.hasParking;
      if (filters.hasLocker !== undefined)
        facilityConditions.hasLocker = filters.hasLocker;

      if (Object.keys(facilityConditions).length > 0) {
        whereConditions.facilities = facilityConditions;
      }

      if (filters.priceRange !== undefined) {
        whereConditions.priceRange = filters.priceRange;
      }
    }

    // Prisma로 관계 데이터 포함하여 조회
    const gymsWithRelations = await prisma.gym.findMany({
      where: whereConditions,
      include: {
        facilities: true,
        operatingHours: {
          orderBy: {
            dayOfWeek: "asc",
          },
        },
      },
    });

    // FTS 결과와 관계 데이터 결합 (ftsRank 포함)
    const ftsRankMap = new Map(ftsResults.map((g) => [g.id, g.fts_rank]));

    return gymsWithRelations.map((gym) => ({
      ...gym,
      ftsRank: ftsRankMap.get(gym.id) || 0,
    }));
  }

  /**
   * 위치 기반 헬스장 검색 (기존 로직)
   *
   * 검색어가 없을 때 사용하는 기존 위치 기반 검색 로직
   *
   * @param bbox 좌표 범위
   * @param filters 필터 옵션
   * @returns 헬스장 배열
   */
  private async searchByLocation(
    bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number },
    filters?: GymSearchFilter,
  ) {
    // Prisma 쿼리 조건 구성
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

    // 필터 조건 추가
    if (filters) {
      const facilityConditions: any = {};
      if (filters.hasRehabEquipment !== undefined)
        facilityConditions.hasRehabEquipment = filters.hasRehabEquipment;
      if (filters.hasPtCoach !== undefined)
        facilityConditions.hasPtCoach = filters.hasPtCoach;
      if (filters.hasShower !== undefined)
        facilityConditions.hasShower = filters.hasShower;
      if (filters.hasParking !== undefined)
        facilityConditions.hasParking = filters.hasParking;
      if (filters.hasLocker !== undefined)
        facilityConditions.hasLocker = filters.hasLocker;

      if (Object.keys(facilityConditions).length > 0) {
        whereConditions.facilities = facilityConditions;
      }

      if (filters.priceRange !== undefined) {
        whereConditions.priceRange = filters.priceRange;
      }
    }

    // DB 조회 (facilities, operatingHours 관계 포함)
    return await prisma.gym.findMany({
      where: whereConditions,
      include: {
        facilities: true,
        operatingHours: {
          orderBy: {
            dayOfWeek: "asc",
          },
        },
      },
    });
  }

  /**
   * 네이버 API로 헬스장 검색 (Fallback)
   *
   * @param request 검색 요청
   * @returns PlaceItem 배열 (거리 정보 포함)
   */
  private async searchFromAPI(
    request: GymSearchRequest,
  ): Promise<Array<PlaceItem & { distanceMeters: number }>> {
    try {
      const placeSearchService = getPlaceSearchService();

      const results = await placeSearchService.searchGymsNearbyMultipleKeywords(
        request.lat,
        request.lng,
        {
          maxResults: 20, // 최대 20개까지 가져오기
          sortBy: "distance",
        },
      );

      // normalizePlaceItem으로 정규화 (운영시간 파싱 포함)
      // distanceMeters는 유지해야 하므로 별도로 처리
      const normalizedResults: Array<PlaceItem & { distanceMeters: number }> =
        results.map((item) => {
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
            console.warn("[GymSearchService] PlaceItem 정규화 실패:", error);
            // 정규화 실패 시 원본 반환 (distanceMeters 포함)
            return item;
          }
        });

      return normalizedResults;
    } catch (error) {
      console.error("[GymSearchService] API 검색 실패:", error);
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
    centerLng: number,
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
        placeItem.lng,
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
          hasRehabEquipment: false,
          hasPtCoach: false,
          hasShower: false,
          hasParking: false,
          hasLocker: false,
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
    apiResults: GymSearchResult[],
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
    placeItems: Array<PlaceItem & { distanceMeters: number }>,
  ): Promise<void> {
    for (const placeItem of placeItems) {
      try {
        // PlaceItem을 Gym 데이터로 변환
        const { gym, facility, operatingHours } =
          convertPlaceItemToGymAllData(placeItem);

        // Gym Upsert (name + address로 기존 레코드 찾기)
        const existingGymId = await this.findGymByNameAndAddress(
          gym.name,
          gym.address,
        );

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
              }),
            ),
          );
        }
      } catch (error) {
        console.error(
          `[GymSearchService] Upsert 실패 (${placeItem.title}):`,
          error,
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
    address: string,
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
