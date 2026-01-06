/**
 * @file monitor.ts
 * @description 네이버맵 API 호출량 모니터링
 * 
 * 네이버맵 API 호출량을 추적하고, 한도 초과 경고를 제공합니다.
 * 
 * 주요 기능:
 * - 일/주 단위 호출 수 추적
 * - 한도 70-80% 도달 시 알림 (로깅)
 * - 호출량 통계 저장 (향후 DB 연동 가능)
 * 
 * 참고: PRD.md에 따르면 일/주 단위 호출 수를 로그로 기록하고,
 * 한도 70-80% 도달 시 알림이 필요합니다.
 */

import type { ApiCallRecord, UsageStats } from '@/types/naver-map';

/**
 * API 호출량 모니터링 클래스
 * 
 * 초기에는 메모리 기반으로 구현하고, 향후 DB 연동 가능하도록 구조를 설계합니다.
 */
export class NaverMapApiMonitor {
  private static instance: NaverMapApiMonitor;
  private callRecords: ApiCallRecord[] = [];
  private readonly dailyLimit = 25000; // 네이버 지역 검색 API 일일 한도
  private readonly warningThreshold = 0.7; // 70%
  private readonly dangerThreshold = 0.8; // 80%

  private constructor() {
    // 싱글톤 패턴
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): NaverMapApiMonitor {
    if (!NaverMapApiMonitor.instance) {
      NaverMapApiMonitor.instance = new NaverMapApiMonitor();
    }
    return NaverMapApiMonitor.instance;
  }

  /**
   * API 호출 기록
   * 
   * @param apiType API 타입 (예: 'place-search', 'geocoding')
   * @param success 성공 여부
   * @param responseTime 응답 시간 (밀리초, 선택)
   * @param timestamp 호출 시간 (기본값: 현재 시간)
   */
  recordApiCall(
    apiType: string,
    success: boolean = true,
    responseTime?: number,
    timestamp?: Date
  ): void {
    const record: ApiCallRecord = {
      apiType,
      timestamp: timestamp || new Date(),
      success,
      responseTime,
    };

    this.callRecords.push(record);

    // 메모리 관리: 7일 이상 된 기록은 삭제
    this.cleanupOldRecords();

    // 한도 경고 확인
    this.checkLimitWarning();
  }

  /**
   * 현재 호출량 통계 조회
   * 
   * @param period 통계 기간 ('day' | 'week')
   * @returns 사용 통계
   */
  getUsageStats(period: 'day' | 'week'): UsageStats {
    const now = new Date();
    const startDate = new Date(now);

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else {
      // 주간: 7일 전
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    const periodRecords = this.callRecords.filter(
      (record) => record.timestamp >= startDate && record.success
    );

    const totalCalls = periodRecords.length;
    const limit = this.dailyLimit * (period === 'day' ? 1 : 7);
    const usagePercent = (totalCalls / limit) * 100;
    const isWarning = usagePercent >= this.warningThreshold * 100;
    const isDanger = usagePercent >= this.dangerThreshold * 100;

    return {
      period,
      totalCalls,
      limit,
      usagePercent: Math.round(usagePercent * 100) / 100, // 소수점 2자리
      isWarning,
      isDanger,
    };
  }

  /**
   * 한도 초과 경고 확인
   * 
   * @returns 경고 여부
   */
  checkLimitWarning(): boolean {
    const dayStats = this.getUsageStats('day');
    const weekStats = this.getUsageStats('week');

    // 일일 한도 경고
    if (dayStats.isDanger) {
      console.error(
        `🚨 네이버맵 API 일일 한도 위험: ${dayStats.totalCalls}/${dayStats.limit} (${dayStats.usagePercent.toFixed(2)}%)`
      );
      return true;
    } else if (dayStats.isWarning) {
      console.warn(
        `⚠️  네이버맵 API 일일 한도 경고: ${dayStats.totalCalls}/${dayStats.limit} (${dayStats.usagePercent.toFixed(2)}%)`
      );
      return true;
    }

    // 주간 한도 경고
    if (weekStats.isDanger) {
      console.error(
        `🚨 네이버맵 API 주간 한도 위험: ${weekStats.totalCalls}/${weekStats.limit} (${weekStats.usagePercent.toFixed(2)}%)`
      );
      return true;
    } else if (weekStats.isWarning) {
      console.warn(
        `⚠️  네이버맵 API 주간 한도 경고: ${weekStats.totalCalls}/${weekStats.limit} (${weekStats.usagePercent.toFixed(2)}%)`
      );
      return true;
    }

    return false;
  }

  /**
   * 오래된 기록 정리 (7일 이상)
   */
  private cleanupOldRecords(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    this.callRecords = this.callRecords.filter(
      (record) => record.timestamp >= sevenDaysAgo
    );
  }

  /**
   * 모든 기록 초기화 (테스트용)
   */
  reset(): void {
    this.callRecords = [];
  }

  /**
   * 특정 기간의 호출 기록 조회
   * 
   * @param startDate 시작 날짜
   * @param endDate 종료 날짜
   * @returns 호출 기록 목록
   */
  getRecords(
    startDate?: Date,
    endDate?: Date
  ): ApiCallRecord[] {
    let records = [...this.callRecords];

    if (startDate) {
      records = records.filter((record) => record.timestamp >= startDate);
    }

    if (endDate) {
      records = records.filter((record) => record.timestamp <= endDate);
    }

    return records.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * API 타입별 통계 조회
   * 
   * @param period 통계 기간
   * @returns API 타입별 호출 횟수
   */
  getStatsByApiType(period: 'day' | 'week'): Record<string, number> {
    const now = new Date();
    const startDate = new Date(now);

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    const periodRecords = this.callRecords.filter(
      (record) => record.timestamp >= startDate && record.success
    );

    const stats: Record<string, number> = {};

    for (const record of periodRecords) {
      stats[record.apiType] = (stats[record.apiType] || 0) + 1;
    }

    return stats;
  }
}

/**
 * 전역 모니터 인스턴스 (편의 함수)
 */
export const naverMapApiMonitor = NaverMapApiMonitor.getInstance();

