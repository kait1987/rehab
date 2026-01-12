/**
 * ENG-S2-03: Body Parts 50+ 시드 스크립트
 * 
 * body_parts를 50+개로 확장하고 계층 구조를 설정합니다.
 * 
 * 실행: npx tsx scripts/seed-body-parts-50.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BodyPartSeed {
  name: string;
  parentName?: string;
  level: 1 | 2;
  synonyms: string[];
  displayOrder: number;
}

// 50+ 부위 데이터 정의
const BODY_PARTS_DATA: BodyPartSeed[] = [
  // === 대분류 (Level 1) ===
  { name: '상체', level: 1, synonyms: ['상반신', 'upper body'], displayOrder: 1 },
  { name: '하체', level: 1, synonyms: ['하반신', 'lower body'], displayOrder: 2 },
  { name: '코어', level: 1, synonyms: ['복부', 'core', '중심부'], displayOrder: 3 },
  
  // === 상체 소분류 (Level 2) ===
  { name: '어깨', parentName: '상체', level: 2, synonyms: ['숄더', 'shoulder', '견관절'], displayOrder: 10 },
  { name: '전면삼각근', parentName: '어깨', level: 2, synonyms: ['앞어깨'], displayOrder: 11 },
  { name: '측면삼각근', parentName: '어깨', level: 2, synonyms: ['옆어깨'], displayOrder: 12 },
  { name: '후면삼각근', parentName: '어깨', level: 2, synonyms: ['뒷어깨'], displayOrder: 13 },
  { name: '회전근개', parentName: '어깨', level: 2, synonyms: ['로테이터커프', 'rotator cuff'], displayOrder: 14 },
  
  { name: '목', parentName: '상체', level: 2, synonyms: ['넥', 'neck', '경추'], displayOrder: 20 },
  { name: '경추', parentName: '목', level: 2, synonyms: ['목뼈'], displayOrder: 21 },
  { name: '승모근상부', parentName: '목', level: 2, synonyms: ['상부승모근', 'upper trap'], displayOrder: 22 },
  
  { name: '등', parentName: '상체', level: 2, synonyms: ['백', 'back', '등근육'], displayOrder: 30 },
  { name: '광배근', parentName: '등', level: 2, synonyms: ['랫', 'lat'], displayOrder: 31 },
  { name: '능형근', parentName: '등', level: 2, synonyms: ['롬보이드', 'rhomboid'], displayOrder: 32 },
  { name: '척추기립근', parentName: '등', level: 2, synonyms: ['기립근', 'erector spinae'], displayOrder: 33 },
  { name: '흉추', parentName: '등', level: 2, synonyms: ['등뼈', '흉추부'], displayOrder: 34 },
  
  { name: '가슴', parentName: '상체', level: 2, synonyms: ['체스트', 'chest', '흉근'], displayOrder: 40 },
  { name: '대흉근', parentName: '가슴', level: 2, synonyms: ['가슴근육', 'pec major'], displayOrder: 41 },
  { name: '소흉근', parentName: '가슴', level: 2, synonyms: ['pec minor'], displayOrder: 42 },
  
  { name: '팔', parentName: '상체', level: 2, synonyms: ['암', 'arm'], displayOrder: 50 },
  { name: '이두', parentName: '팔', level: 2, synonyms: ['이두근', 'biceps'], displayOrder: 51 },
  { name: '삼두', parentName: '팔', level: 2, synonyms: ['삼두근', 'triceps'], displayOrder: 52 },
  { name: '전완', parentName: '팔', level: 2, synonyms: ['전완근', 'forearm'], displayOrder: 53 },
  
  { name: '팔꿈치', parentName: '상체', level: 2, synonyms: ['엘보', 'elbow'], displayOrder: 55 },
  { name: '손목', parentName: '상체', level: 2, synonyms: ['리스트', 'wrist'], displayOrder: 56 },
  { name: '손가락', parentName: '상체', level: 2, synonyms: ['핑거', 'finger'], displayOrder: 57 },
  
  // === 하체 소분류 (Level 2) ===
  { name: '골반', parentName: '하체', level: 2, synonyms: ['힙', 'pelvis', '엉덩이'], displayOrder: 60 },
  { name: '대둔근', parentName: '골반', level: 2, synonyms: ['엉덩이근육', 'glute max'], displayOrder: 61 },
  { name: '중둔근', parentName: '골반', level: 2, synonyms: ['glute med'], displayOrder: 62 },
  { name: '외회전근', parentName: '골반', level: 2, synonyms: ['고관절외회전', 'hip external rotator'], displayOrder: 63 },
  { name: '장요근', parentName: '골반', level: 2, synonyms: ['힙플렉서', 'hip flexor', 'iliopsoas'], displayOrder: 64 },
  { name: '골반저근', parentName: '골반', level: 2, synonyms: ['pelvic floor'], displayOrder: 65 },
  
  { name: '다리', parentName: '하체', level: 2, synonyms: ['레그', 'leg', '하지'], displayOrder: 70 },
  { name: '대퇴사두', parentName: '다리', level: 2, synonyms: ['쿼드', 'quadriceps', '앞허벅지'], displayOrder: 71 },
  { name: '슬괵근', parentName: '다리', level: 2, synonyms: ['햄스트링', 'hamstring', '뒷허벅지'], displayOrder: 72 },
  { name: '내전근', parentName: '다리', level: 2, synonyms: ['허벅지안쪽', 'adductor'], displayOrder: 73 },
  { name: '외전근', parentName: '다리', level: 2, synonyms: ['허벅지바깥', 'abductor'], displayOrder: 74 },
  
  { name: '무릎', parentName: '하체', level: 2, synonyms: ['니', 'knee', '슬관절'], displayOrder: 75 },
  { name: '슬개골주변', parentName: '무릎', level: 2, synonyms: ['무릎앞', 'patella'], displayOrder: 76 },
  
  { name: '발목', parentName: '하체', level: 2, synonyms: ['앵클', 'ankle'], displayOrder: 80 },
  { name: '비복근', parentName: '발목', level: 2, synonyms: ['카프', 'calf', '종아리'], displayOrder: 81 },
  { name: '가자미근', parentName: '발목', level: 2, synonyms: ['솔레우스', 'soleus'], displayOrder: 82 },
  { name: '전경골근', parentName: '발목', level: 2, synonyms: ['정강이', 'tibialis anterior'], displayOrder: 83 },
  
  { name: '발', parentName: '하체', level: 2, synonyms: ['풋', 'foot'], displayOrder: 85 },
  { name: '족저근막', parentName: '발', level: 2, synonyms: ['발바닥근막', 'plantar fascia'], displayOrder: 86 },
  { name: '아킬레스건', parentName: '발', level: 2, synonyms: ['아킬레스', 'achilles tendon'], displayOrder: 87 },
  
  // === 코어 소분류 (Level 2) ===
  { name: '허리', parentName: '코어', level: 2, synonyms: ['요추', 'lumbar', '요부'], displayOrder: 90 },
  { name: '요방형근', parentName: '허리', level: 2, synonyms: ['QL', 'quadratus lumborum'], displayOrder: 91 },
  { name: '다열근', parentName: '허리', level: 2, synonyms: ['멀티피더스', 'multifidus'], displayOrder: 92 },
  
  { name: '복부', parentName: '코어', level: 2, synonyms: ['앱스', 'abs', '복근'], displayOrder: 95 },
  { name: '복직근', parentName: '복부', level: 2, synonyms: ['식스팩', 'rectus abdominis'], displayOrder: 96 },
  { name: '외복사근', parentName: '복부', level: 2, synonyms: ['external oblique'], displayOrder: 97 },
  { name: '내복사근', parentName: '복부', level: 2, synonyms: ['internal oblique'], displayOrder: 98 },
  { name: '복횡근', parentName: '복부', level: 2, synonyms: ['TVA', 'transverse abdominis'], displayOrder: 99 },
];

async function seedBodyParts() {
  console.log('🌱 Body Parts 50+ 시드 시작...\n');

  // ID 매핑 저장
  const nameToId = new Map<string, string>();
  let created = 0;
  let updated = 0;

  // 레벨 순서로 정렬 (부모가 먼저 생성되도록)
  const sortedData = [...BODY_PARTS_DATA].sort((a, b) => a.level - b.level);

  for (const part of sortedData) {
    try {
      // 부모 ID 찾기
      let parentId: string | null = null;
      if (part.parentName) {
        parentId = nameToId.get(part.parentName) || null;
        if (!parentId) {
          // DB에서 조회
          const parent = await prisma.bodyPart.findFirst({
            where: { name: part.parentName }
          });
          if (parent) {
            parentId = parent.id;
            nameToId.set(part.parentName, parent.id);
          }
        }
      }

      // UPSERT
      const result = await prisma.bodyPart.upsert({
        where: { name: part.name },
        update: {
          parentId,
          level: part.level,
          synonyms: part.synonyms,
          displayOrder: part.displayOrder,
          isActive: true
        },
        create: {
          name: part.name,
          parentId,
          level: part.level,
          synonyms: part.synonyms,
          displayOrder: part.displayOrder,
          isActive: true
        }
      });

      nameToId.set(part.name, result.id);
      
      // 새로 생성 vs 업데이트 구분
      const existing = await prisma.bodyPart.findFirst({
        where: { name: part.name }
      });
      if (existing) {
        updated++;
      } else {
        created++;
      }
    } catch (err) {
      console.error(`❌ 오류 (${part.name}):`, err);
    }
  }

  // 최종 카운트
  const totalCount = await prisma.bodyPart.count();
  const hierarchyCount = await prisma.bodyPart.count({
    where: { parentId: { not: null } }
  });

  console.log('\n📊 결과:');
  console.log(`   총 부위 수: ${totalCount}개`);
  console.log(`   계층 구조: ${hierarchyCount}개`);

  if (totalCount >= 50) {
    console.log('✅ 목표 달성! (50개 이상)');
  } else {
    console.log(`⚠️ 목표 미달: ${50 - totalCount}개 추가 필요`);
  }
}

async function main() {
  try {
    await seedBodyParts();
    console.log('\n✅ 시드 완료!');
  } catch (error) {
    console.error('❌ 시드 실패:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
