/**
 * 포맷팅 유틸리티 함수
 */

/**
 * 숫자를 원화 형식으로 포맷팅
 * @param amount 원 단위 금액
 * @returns 포맷팅된 문자열 (예: "50,000원")
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

/**
 * 숫자를 원화 형식으로 포맷팅 (원 표시 없이)
 * @param amount 원 단위 금액
 * @returns 포맷팅된 문자열 (예: "50,000")
 */
export function formatPriceNumber(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount);
}

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param date 날짜 문자열 또는 Date 객체
 * @returns 포맷팅된 문자열 (예: "2025년 1월 1일")
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * 날짜와 시간을 한국어 형식으로 포맷팅
 * @param date 날짜 문자열 또는 Date 객체
 * @returns 포맷팅된 문자열 (예: "2025년 1월 1일 오후 3:30")
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(d);
}

