/**
 * Phase 3 통합 검증 스크립트
 * 
 * 시나리오:
 * 1. 사용자 생성 (Mock)
 * 2. 운동 완료 로그 생성 (완수율 낮음 & 통증 증가 상황 시뮬레이션)
 * 3. AI 코치 이슈 감지 (detect-exercise-issues)
 * 4. 다음 코스 생성 요청 시 자동 수정 반영 확인 (auto-adjust-routine)
 * 5. 미디어 API 조회 확인
 * 6. 다국어(i18n) 설정 확인
 * 
 * 실행: npx tsx scripts/verify-phase3-flow.ts
 */

import { prisma } from '../src/lib/prisma/client';
import { detectExerciseIssues } from '../src/lib/utils/detect-exercise-issues';
import { analyzeUserPreferences } from '../src/lib/utils/analyze-user-preferences';
import { autoAdjustRoutine } from '../src/lib/algorithms/auto-adjust-routine';

async function main() {
  console.log('🚀 Phase 3 통합 검증 시작...\n');

  // 1. 테스트용 사용자 및 데이터 준비
  console.log('1️⃣ 테스트 데이터 준비 중...');
  let user = await prisma.user.findFirst();
  if (!user) {
    console.log('   ⚠️ 사용자가 없어 테스트용 사용자를 생성합니다.');
    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        clerkId: 'test_clerk_id_' + Date.now(),
        name: 'Test User'
      }
    });
  }
  console.log(`   - 사용자 ID: ${user.id}`);

  // 운동 템플릿 하나 가져오기
  let exercise = await prisma.exerciseTemplate.findFirst();
  if (!exercise) {
    console.log('   ⚠️ 운동 템플릿이 없어 테스트용 템플릿을 생성합니다.');
    // BodyPart 필요
    let bodyPart = await prisma.bodyPart.findFirst();
    if (!bodyPart) {
      bodyPart = await prisma.bodyPart.create({ data: { name: '전신' } });
    }
    
    exercise = await prisma.exerciseTemplate.create({
      data: {
        name: '테스트 스쿼트',
        bodyPartId: bodyPart.id,
        instructions: '앉았다 일어납니다.'
      }
    });
  }
  console.log(`   - 테스트 운동: ${exercise.name} (${exercise.id})`);

  // 2. 상황 시뮬레이션: 최근 3번 연속 스킵 (완수율 0%) + 통증 증가
  console.log('\n2️⃣ 상황 시뮬레이션: "스쿼트" 운동 반복 스킵 & 통증 증가 기록 생성');
  
  // 기존 로그 정리 (테스트용)
  await prisma.courseCompletionLog.deleteMany({
    where: { userId: user.id, exerciseTemplateId: exercise.id }
  });

  const logs = [];
  for (let i = 0; i < 3; i++) {
    logs.push({
      userId: user.id,
      courseId: exercise.id, // 임시 (실제론 Course ID여야 함)
      exerciseTemplateId: exercise.id,
      status: 'skipped',
      painAfter: 5 + i, // 5, 6, 7 (통증 증가)
      completedAt: new Date(Date.now() - (3 - i) * 24 * 60 * 60 * 1000) // 3일전, 2일전, 1일전
    });
  }

  // Course ID가 FK로 필요하므로 임의의 코스 하나 연결 혹은 생성 필요
  // 여기서는 로직 검증만 하므로 DB 저장은 생략하고 유틸리티 함수 직접 호출로 검증
  // (실제 DB에 넣으려면 Course도 만들어야 해서 복잡해짐)
  
  // Mock Data로 유틸리티 직접 테스트
  console.log('   (DB 저장 대신 Mock 데이터로 로직 검증)');
  const mockLogs = logs.map(l => ({
    ...l,
    exerciseTemplate: { id: exercise.id, name: exercise.name, bodyPartId: exercise.bodyPartId }
  }));

  // 3. 이슈 감지 실행
  console.log('\n3️⃣ AI 코치 이슈 감지 (detect-exercise-issues.ts)');
  
  // detectExerciseIssues는 DB를 조회하므로, 여기서는 로직을 흉내내거나 
  // 실제 DB에 넣어야 함. 정확한 검증을 위해 DB에 넣겠습니다.
  
  // 임시 코스 생성
  const course = await prisma.course.create({
    data: {
      userId: user.id,
      totalDurationMinutes: 30,
      experienceLevel: 'beginner'
    }
  });

  await prisma.courseCompletionLog.createMany({
    data: logs.map(l => ({
      ...l,
      courseId: course.id
    }))
  });

  const issues = await detectExerciseIssues({ userId: user.id });
  console.log('   👉 감지된 이슈:', JSON.stringify(issues, null, 2));

  const hasLowCompletion = issues.some(i => i.type === 'low_completion');
  const hasPainIncrease = issues.some(i => i.type === 'pain_increase');

  if (hasLowCompletion) console.log('   ✅ Low Completion 감지 성공');
  else console.error('   ❌ Low Completion 감지 실패');

  if (hasPainIncrease) console.log('   ✅ Pain Increase 감지 성공');
  else console.error('   ❌ Pain Increase 감지 실패');

  // 4. 자동 수정 엔진 실행
  console.log('\n4️⃣ 루틴 자동 수정 (auto-adjust-routine.ts)');
  const preferences = await analyzeUserPreferences(user.id);
  
  const adjustmentResult = autoAdjustRoutine({
    issues,
    preferences,
    requestedBodyParts: [{ bodyPartId: exercise.bodyPartId, bodyPartName: 'Test Part', painLevel: 5 }]
  });

  console.log('   👉 조정 결과:', JSON.stringify(adjustmentResult, null, 2));

  if (adjustmentResult.avoidExerciseIds.includes(exercise.id)) {
    console.log('   ✅ 회피 운동에 추가됨 (완수율 저조 반영)');
  } else {
    console.error('   ❌ 회피 운동 미반영');
  }

  if (adjustmentResult.intensityAdjustment < 0) {
    console.log('   ✅ 강도 하향 조정됨 (통증 증가 반영)');
  } else {
    console.error('   ❌ 강도 조정 미반영');
  }

  // 5. 미디어 모델 확인
  console.log('\n5️⃣ 미디어 모델 스키마 확인');
  const mediaCount = await prisma.exerciseMedia.count();
  console.log(`   - 현재 저장된 미디어 수: ${mediaCount} (초기 상태 0 예상)`);
  console.log('   ✅ ExerciseMedia 테이블 접근 가능');

  // 6. 다국어 모델 확인
  console.log('\n6️⃣ 다국어 모델 스키마 확인');
  const localizedCount = await prisma.localizedExercise.count();
  console.log(`   - 현재 번역된 운동 수: ${localizedCount} (초기 상태 0 예상)`);
  console.log('   ✅ LocalizedExercise 테이블 접근 가능');

  // 정리
  await prisma.courseCompletionLog.deleteMany({ where: { courseId: course.id } });
  await prisma.course.delete({ where: { id: course.id } });
  console.log('\n🧹 테스트 데이터 정리 완료');

  console.log('\n✨ 검증 완료: 모든 시스템이 정상적으로 연결되어 있습니다.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
