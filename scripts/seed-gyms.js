const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 서울 주요 지역 샘플 헬스장 데이터
const sampleGyms = [
  {
    name: '피트니스 센터 강남점',
    address: '서울특별시 강남구 역삼동 123-45',
    latitude: 37.5008,
    longitude: 126.8682,
    phone: '02-1234-5678',
    priceRange: '중',
    isActive: true,
  },
  {
    name: '재활운동센터 영등포',
    address: '서울특별시 영등포구 영등포동 234-56',
    latitude: 37.5160,
    longitude: 126.9073,
    phone: '02-2345-6789',
    priceRange: '중',
    isActive: true,
  },
  {
    name: '헬스플러스 목동점',
    address: '서울특별시 양천구 목동 345-67',
    latitude: 37.5326,
    longitude: 126.8756,
    phone: '02-3456-7890',
    priceRange: '고',
    isActive: true,
  },
  {
    name: '바디핏 구로점',
    address: '서울특별시 구로구 구로동 456-78',
    latitude: 37.5013,
    longitude: 126.8844,
    phone: '02-4567-8901',
    priceRange: '저',
    isActive: true,
  },
  {
    name: '파워짐 신도림점',
    address: '서울특별시 구로구 신도림동 567-89',
    latitude: 37.5089,
    longitude: 126.8911,
    phone: '02-5678-9012',
    priceRange: '중',
    isActive: true,
  },
  {
    name: '스포츠센터 여의도',
    address: '서울특별시 영등포구 여의도동 678-90',
    latitude: 37.5219,
    longitude: 126.9245,
    phone: '02-6789-0123',
    priceRange: '고',
    isActive: true,
  },
  {
    name: '피트니스타운 가산점',
    address: '서울특별시 금천구 가산동 789-01',
    latitude: 37.4782,
    longitude: 126.8873,
    phone: '02-7890-1234',
    priceRange: '중',
    isActive: true,
  },
  {
    name: '헬스클럽 발산점',
    address: '서울특별시 강서구 발산동 890-12',
    latitude: 37.5584,
    longitude: 126.8376,
    phone: '02-8901-2345',
    priceRange: '저',
    isActive: true,
  },
  {
    name: '재활헬스 마곡점',
    address: '서울특별시 강서구 마곡동 901-23',
    latitude: 37.5578,
    longitude: 126.8271,
    phone: '02-9012-3456',
    priceRange: '중',
    isActive: true,
  },
  {
    name: '웰니스짐 등촌점',
    address: '서울특별시 강서구 등촌동 012-34',
    latitude: 37.5505,
    longitude: 126.8558,
    phone: '02-0123-4567',
    priceRange: '저',
    isActive: true,
  },
];

async function main() {
  console.log('🏋️ 샘플 헬스장 데이터 추가 시작...\n');

  let successCount = 0;

  for (const gym of sampleGyms) {
    try {
      // 이미 존재하는지 확인 (이름으로)
      const existing = await prisma.gym.findFirst({
        where: { name: gym.name }
      });

      if (existing) {
        console.log(`⏭️  [${gym.name}] 이미 존재, 건너뜀`);
        continue;
      }

      await prisma.gym.create({ data: gym });
      successCount++;
      console.log(`✅ [${gym.name}] 추가됨`);
    } catch (error) {
      console.error(`❌ [${gym.name}] 에러:`, error.message);
    }
  }

  console.log(`\n📈 결과: ${successCount}개 추가됨`);
  
  // 총 개수 확인
  const total = await prisma.gym.count();
  console.log(`📊 전체 헬스장: ${total}개`);
}

main()
  .catch((e) => {
    console.error('❌ 스크립트 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
