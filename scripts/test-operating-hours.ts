/**
 * @file test-operating-hours.ts
 * @description 운영시간 파싱 함수 테스트 스크립트
 * 
 * PHASE2 문서의 4개 테스트 케이스를 실행하여 파싱 결과를 검증합니다.
 * 
 * 실행 방법:
 *   pnpm tsx scripts/test-operating-hours.ts
 */

import { parseOperatingHoursFromDescription } from '../src/lib/utils/parse-operating-hours';
import type { OperatingHours } from '../src/types/operating-hours';

/**
 * 요일 이름 매핑
 */
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 운영시간 배열을 읽기 쉬운 형식으로 포맷팅
 */
function formatOperatingHours(hours: OperatingHours[]): string {
  const lines: string[] = [];
  
  for (const hour of hours) {
    const dayName = DAY_NAMES[hour.dayOfWeek];
    
    if (hour.isClosed) {
      lines.push(`  ${dayName}요일: 휴무`);
    } else if (hour.openTime && hour.closeTime) {
      const notes = hour.notes ? ` (${hour.notes})` : '';
      lines.push(`  ${dayName}요일: ${hour.openTime}~${hour.closeTime}${notes}`);
    } else {
      lines.push(`  ${dayName}요일: 운영시간 없음`);
    }
  }
  
  return lines.join('\n');
}

/**
 * 테스트 케이스 실행 및 결과 출력
 */
function runTestCase(
  name: string,
  input: string,
  expected: string
): void {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 ${name}`);
  console.log('='.repeat(80));
  console.log(`\n입력: "${input}"`);
  console.log(`\n예상 결과: ${expected}`);
  
  try {
    const result = parseOperatingHoursFromDescription(input);
    
    console.log('\n실제 결과:');
    console.log(formatOperatingHours(result));
    
    // 간단한 검증
    console.log('\n✅ 파싱 성공');
    console.log(`   - 총 ${result.length}개 요일 파싱됨`);
    
    // 24시간 체크
    const is24Hours = result.every(
      h => h.openTime === '00:00' && h.closeTime === '23:59' && !h.isClosed
    );
    if (is24Hours) {
      console.log('   - 24시간 운영 감지됨');
    }
    
    // 휴무일 체크
    const closedDays = result.filter(h => h.isClosed);
    if (closedDays.length > 0) {
      const closedDayNames = closedDays.map(h => DAY_NAMES[h.dayOfWeek]).join(', ');
      console.log(`   - 휴무일: ${closedDayNames}요일`);
    }
    
    // 브레이크 타임 체크
    const hasBreakTime = result.some(h => h.notes && h.notes.includes('브레이크'));
    if (hasBreakTime) {
      console.log('   - 브레이크 타임 감지됨');
    }
    
    // 자정 넘김 체크
    const hasMidnightCrossing = result.some(
      h => h.notes && h.notes.includes('자정 넘김')
    );
    if (hasMidnightCrossing) {
      console.log('   - 자정 넘김 감지됨');
    }
    
  } catch (error) {
    console.error('\n❌ 파싱 실패:', error);
    if (error instanceof Error) {
      console.error('   에러 메시지:', error.message);
      console.error('   스택:', error.stack);
    }
  }
}

/**
 * 메인 함수
 */
function main() {
  console.log('🚀 운영시간 파싱 함수 테스트 시작\n');
  console.log('PHASE2 문서의 4개 테스트 케이스를 실행합니다.\n');
  
  const testCases = [
    {
      name: '케이스 1: 24시간 연중무휴',
      input: '24시간 연중무휴',
      expected: '모든 요일 00:00~23:59',
    },
    {
      name: '케이스 2: 평일/주말 구분',
      input: '평일 10:00~22:00 / 주말 휴무',
      expected: '월~금 10:00~22:00, 토~일 휴무',
    },
    {
      name: '케이스 3: 브레이크 타임',
      input: '월~금 09:00~18:00 (브레이크타임 12:00~13:00)',
      expected: '월~금 09:00~18:00, notes에 브레이크타임',
    },
    {
      name: '케이스 4: 자정 넘김',
      input: '매일 18:00~02:00',
      expected: '모든 요일 18:00~02:00',
    },
  ];
  
  // 각 테스트 케이스 실행
  for (const testCase of testCases) {
    runTestCase(testCase.name, testCase.input, testCase.expected);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ 모든 테스트 케이스 실행 완료');
  console.log('='.repeat(80) + '\n');
}

// 스크립트 실행
main();

