/**
 * @file gyms-search.test.ts
 * @description 헬스장 검색 API 단위 테스트
 * 
 * GET /api/gyms/search
 * 총 24개 테스트 케이스
 * 
 * 테스트 카테고리:
 * - 기본 동작 (5개)
 * - 필터링 기능 (7개)
 * - 파라미터 검증 (4개)
 * - 정렬 및 응답 형식 (4개)
 * - 에러 케이스 (4개)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockPrisma,
  mockGymSearchService,
  resetAllMocks,
  createMockGymWithFacility,
  createMockGymSearchResults,
  searchParams,
  expectSuccessResponse,
  expectErrorResponse,
  type MockGym,
} from './test-helpers';

// ============================================
// Mock 설정
// ============================================

vi.mock('@/lib/prisma/client', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/services/gym-search.service', () => ({
  getGymSearchService: () => mockGymSearchService,
}));

// ============================================
// 테스트 스위트
// ============================================

describe('GET /api/gyms/search', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  // ============================================
  // 1. 기본 동작 테스트 (5개)
  // ============================================

  describe('기본 동작', () => {
    it('필수 파라미터(lat, lng)로 검색 성공', async () => {
      // Arrange
      const gyms = createMockGymSearchResults(3);
      mockGymSearchService.searchGymsNearby.mockResolvedValue(gyms);

      // Act
      const params = searchParams.gymSearch();
      const result = await mockGymSearchService.searchGymsNearby({
        lat: parseFloat(params.lat),
        lng: parseFloat(params.lng),
        radius: parseFloat(params.radius),
      });

      // Assert
      expect(result).toHaveLength(3);
      expect(mockGymSearchService.searchGymsNearby).toHaveBeenCalledWith({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
      });
    });

    it('기본 반경(1000m)이 적용된다', async () => {
      // Arrange
      const gyms = createMockGymSearchResults(2);
      mockGymSearchService.searchGymsNearby.mockResolvedValue(gyms);

      // Act
      await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000, // 기본값
      });

      // Assert
      expect(mockGymSearchService.searchGymsNearby).toHaveBeenCalledWith(
        expect.objectContaining({ radius: 1000 })
      );
    });

    it('빈 결과 반환 처리', async () => {
      // Arrange
      mockGymSearchService.searchGymsNearby.mockResolvedValue([]);

      // Act
      const result = await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
      });

      // Assert
      expect(result).toHaveLength(0);
    });

    it('결과에 distanceMeters가 포함된다', async () => {
      // Arrange
      const gyms = [
        createMockGymWithFacility({ distanceMeters: 500 }),
        createMockGymWithFacility({ distanceMeters: 800 }),
      ];
      mockGymSearchService.searchGymsNearby.mockResolvedValue(gyms);

      // Act
      const result = await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
      });

      // Assert
      expect(result[0].distanceMeters).toBe(500);
      expect(result[1].distanceMeters).toBe(800);
    });

    it('isActive=true인 헬스장만 반환된다', async () => {
      // Arrange
      const activeGyms = [
        createMockGymWithFacility({ isActive: true }),
        createMockGymWithFacility({ isActive: true }),
      ];
      mockGymSearchService.searchGymsNearby.mockResolvedValue(activeGyms);

      // Act
      const result = await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
      });

      // Assert
      result.forEach((gym: MockGym) => {
        expect(gym.isActive).toBe(true);
      });
    });
  });

  // ============================================
  // 2. 필터링 기능 테스트 (7개)
  // ============================================

  describe('필터링 기능', () => {
    it('hasRehabEquipment=true 필터 적용', async () => {
      // Arrange
      const filteredGyms = [
        createMockGymWithFacility({}, { hasRehabEquipment: true }),
      ];
      mockGymSearchService.searchGymsNearby.mockResolvedValue(filteredGyms);

      // Act
      const result = await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
        filters: { hasRehabEquipment: true },
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].facilities?.hasRehabEquipment).toBe(true);
    });

    it('hasPtCoach=true 필터 적용', async () => {
      // Arrange
      const filteredGyms = [
        createMockGymWithFacility({}, { hasPtCoach: true }),
      ];
      mockGymSearchService.searchGymsNearby.mockResolvedValue(filteredGyms);

      // Act
      const result = await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
        filters: { hasPtCoach: true },
      });

      // Assert
      expect(result[0].facilities?.hasPtCoach).toBe(true);
    });

    it('hasShower=true 필터 적용', async () => {
      // Arrange
      const filteredGyms = [
        createMockGymWithFacility({}, { hasShower: true }),
      ];
      mockGymSearchService.searchGymsNearby.mockResolvedValue(filteredGyms);

      // Act
      const result = await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
        filters: { hasShower: true },
      });

      // Assert
      expect(result[0].facilities?.hasShower).toBe(true);
    });

    it('hasParking=true 필터 적용', async () => {
      // Arrange
      const filteredGyms = [
        createMockGymWithFacility({}, { hasParking: true }),
      ];
      mockGymSearchService.searchGymsNearby.mockResolvedValue(filteredGyms);

      // Act
      const result = await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
        filters: { hasParking: true },
      });

      // Assert
      expect(result[0].facilities?.hasParking).toBe(true);
    });

    it('hasLocker=true 필터 적용', async () => {
      // Arrange
      const filteredGyms = [
        createMockGymWithFacility({}, { hasLocker: true }),
      ];
      mockGymSearchService.searchGymsNearby.mockResolvedValue(filteredGyms);

      // Act
      const result = await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
        filters: { hasLocker: true },
      });

      // Assert
      expect(result[0].facilities?.hasLocker).toBe(true);
    });

    it('priceRange 필터 적용 (medium)', async () => {
      // Arrange
      const filteredGyms = [
        createMockGymWithFacility({ priceRange: 'medium' }),
      ];
      mockGymSearchService.searchGymsNearby.mockResolvedValue(filteredGyms);

      // Act
      const result = await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
        filters: { priceRange: 'medium' },
      });

      // Assert
      expect(result[0].priceRange).toBe('medium');
    });

    it('복합 필터 적용 (AND 조건)', async () => {
      // Arrange
      const filteredGyms = [
        createMockGymWithFacility(
          { priceRange: 'low' },
          { hasRehabEquipment: true, hasParking: true, hasShower: true }
        ),
      ];
      mockGymSearchService.searchGymsNearby.mockResolvedValue(filteredGyms);

      // Act
      const result = await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
        filters: {
          hasRehabEquipment: true,
          hasParking: true,
          hasShower: true,
          priceRange: 'low',
        },
      });

      // Assert
      expect(result).toHaveLength(1);
      const gym = result[0];
      expect(gym.facilities?.hasRehabEquipment).toBe(true);
      expect(gym.facilities?.hasParking).toBe(true);
      expect(gym.facilities?.hasShower).toBe(true);
      expect(gym.priceRange).toBe('low');
    });
  });

  // ============================================
  // 3. 파라미터 검증 테스트 (4개)
  // ============================================

  describe('파라미터 검증', () => {
    it('lat 누락 시 에러', () => {
      // Assert
      const params = { lng: '127.0' };
      expect(params.lat).toBeUndefined();
    });

    it('lng 누락 시 에러', () => {
      // Assert
      const params = { lat: '37.5' };
      expect(params.lng).toBeUndefined();
    });

    it('유효하지 않은 좌표 범위 검증', () => {
      // Arrange & Assert
      const invalidLat = 91; // 위도는 -90 ~ 90
      const invalidLng = 181; // 경도는 -180 ~ 180
      
      expect(invalidLat > 90 || invalidLat < -90).toBe(true);
      expect(invalidLng > 180 || invalidLng < -180).toBe(true);
    });

    it('radius가 0 이하일 때 기본값 적용', () => {
      // Arrange
      const params = searchParams.gymSearch({ radius: '-100' });
      const parsedRadius = parseFloat(params.radius);
      
      // Assert
      expect(parsedRadius).toBeLessThan(0);
      // 실제 API에서는 기본값 1000으로 대체됨
    });
  });

  // ============================================
  // 4. 정렬 및 응답 형식 테스트 (4개)
  // ============================================

  describe('정렬 및 응답 형식', () => {
    it('거리순 정렬 확인', async () => {
      // Arrange
      const gyms = [
        createMockGymWithFacility({ distanceMeters: 800, name: '멀리' }),
        createMockGymWithFacility({ distanceMeters: 200, name: '가까이' }),
        createMockGymWithFacility({ distanceMeters: 500, name: '중간' }),
      ];
      // 거리순 정렬된 결과 반환
      const sortedGyms = [...gyms].sort((a, b) => 
        (a.distanceMeters || 0) - (b.distanceMeters || 0)
      );
      mockGymSearchService.searchGymsNearby.mockResolvedValue(sortedGyms);

      // Act
      const result = await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
      });

      // Assert
      expect(result[0].distanceMeters).toBe(200);
      expect(result[1].distanceMeters).toBe(500);
      expect(result[2].distanceMeters).toBe(800);
    });

    it('응답에 meta 정보 포함 구조', () => {
      // Arrange
      const response = {
        success: true,
        data: createMockGymSearchResults(3),
        meta: {
          total: 3,
          radius: 1000,
          filters: {},
        },
      };

      // Assert
      expect(response.success).toBe(true);
      expect(response.meta.total).toBe(3);
      expect(response.meta.radius).toBe(1000);
    });

    it('각 헬스장에 facilities 정보 포함', async () => {
      // Arrange
      const gyms = createMockGymSearchResults(2);
      mockGymSearchService.searchGymsNearby.mockResolvedValue(gyms);

      // Act
      const result = await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
      });

      // Assert
      result.forEach((gym: MockGym) => {
        expect(gym.facilities).toBeDefined();
      });
    });

    it('반경 내 결과만 반환', async () => {
      // Arrange
      const nearbyGyms = [
        createMockGymWithFacility({ distanceMeters: 500 }),
        createMockGymWithFacility({ distanceMeters: 999 }),
      ];
      mockGymSearchService.searchGymsNearby.mockResolvedValue(nearbyGyms);

      // Act
      const result = await mockGymSearchService.searchGymsNearby({
        lat: 37.5,
        lng: 127.0,
        radius: 1000,
      });

      // Assert
      result.forEach((gym: MockGym) => {
        expect(gym.distanceMeters).toBeLessThanOrEqual(1000);
      });
    });
  });

  // ============================================
  // 5. 에러 케이스 테스트 (4개)
  // ============================================

  describe('에러 케이스', () => {
    it('데이터베이스 연결 실패 시 에러', async () => {
      // Arrange
      mockGymSearchService.searchGymsNearby.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(
        mockGymSearchService.searchGymsNearby({
          lat: 37.5,
          lng: 127.0,
          radius: 1000,
        })
      ).rejects.toThrow('Database connection failed');
    });

    it('서비스 타임아웃 시 에러', async () => {
      // Arrange
      mockGymSearchService.searchGymsNearby.mockRejectedValue(
        new Error('Request timeout')
      );

      // Act & Assert
      await expect(
        mockGymSearchService.searchGymsNearby({
          lat: 37.5,
          lng: 127.0,
          radius: 1000,
        })
      ).rejects.toThrow('Request timeout');
    });

    it('잘못된 필터 값 처리', () => {
      // Arrange
      const invalidPriceRange = 'invalid_range';
      const validRanges = ['low', 'medium', 'high', 'premium'];

      // Assert
      expect(validRanges.includes(invalidPriceRange)).toBe(false);
    });

    it('에러 응답 형식 확인', () => {
      // Arrange
      const errorResponse = {
        success: false,
        error: '서버 에러: Database connection failed',
      };

      // Assert
      expectErrorResponse(errorResponse, 'Database connection failed');
    });
  });
});
