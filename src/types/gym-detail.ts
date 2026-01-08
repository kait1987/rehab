/**
 * @file gym-detail.ts
 * @description 헬스장 상세 정보 관련 타입 정의
 * 
 * 헬스장 상세 페이지에서 사용하는 타입들을 정의합니다.
 * Prisma 스키마와 일치하도록 설계되었습니다.
 */

import type { OperatingHours } from './operating-hours';
import type { GymFacilities } from './gym-search';

/**
 * 리뷰 태그 정보
 */
export interface ReviewTagInfo {
  /** 태그 ID */
  id: string;
  /** 태그 이름 */
  name: string;
  /** 태그 카테고리 */
  category: string | null;
}

/**
 * 리뷰 정보 (태그 포함)
 */
export interface ReviewWithTags {
  /** 리뷰 ID */
  id: string;
  /** 사용자 ID (익명 리뷰인 경우 null) */
  userId: string | null;
  /** 코멘트 */
  comment: string | null;
  /** 관리자 리뷰 여부 */
  isAdminReview: boolean;
  /** 태그 목록 */
  tags: ReviewTagInfo[];
  /** 작성일 */
  createdAt: Date;
}

/**
 * 리뷰 태그 통계
 */
export interface ReviewTagStats {
  /** 태그 ID */
  tagId: string;
  /** 태그 이름 */
  tagName: string;
  /** 태그 카테고리 */
  tagCategory: string | null;
  /** 개수 */
  count: number;
}

/**
 * 헬스장 상세 정보
 * 
 * GymSearchResult를 확장하여 상세 페이지에 필요한 모든 정보를 포함합니다.
 */
export interface GymDetail {
  /** 헬스장 ID */
  id: string;
  /** 헬스장 이름 */
  name: string;
  /** 주소 */
  address: string;
  /** 위도 */
  latitude: number;
  /** 경도 */
  longitude: number;
  /** 전화번호 */
  phone: string | null;
  /** 웹사이트 */
  website: string | null;
  /** 가격대 */
  priceRange: string | null;
  /** 설명 */
  description: string | null;
  /** 활성화 여부 */
  isActive: boolean;
  /** 시설 정보 */
  facilities: GymFacilities;
  /** 운영시간 정보 (요일별 7개) */
  operatingHours: OperatingHours[];
  /** 리뷰 목록 */
  reviews: ReviewWithTags[];
  /** 리뷰 태그 통계 */
  reviewTagStats: ReviewTagStats[];
  /** 현재 사용자의 즐겨찾기 여부 (로그인하지 않은 경우 false) */
  isFavorite: boolean;
  /** 생성일 */
  createdAt: Date;
  /** 수정일 */
  updatedAt: Date;
}

/**
 * 헬스장 상세 정보 API 응답
 */
export interface GymDetailResponse {
  /** 성공 여부 */
  success: boolean;
  /** 헬스장 상세 정보 */
  data?: GymDetail;
  /** 에러 메시지 */
  error?: string;
}

