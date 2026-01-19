import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const exercises = {
  "YTWL 운동": "YTWL Exercise",
  "견갑거근 스트레칭 (Levator Scapulae)": "Levator Scapulae Stretch",
  "골반 틸트": "Pelvic Tilt",
  "그립 스트렝스닝": "Grip Strengthening",
  "글루트 킥백": "Glute Kickback",
  "내측광근 강화 운동 (VMO)": "VMO Strengthening",
  "넥 익스텐션": "Neck Extension",
  "넥 플렉션": "Neck Flexion",
  "니 투 체스트 스트레칭": "Knee to Chest Stretch",
  데드버그: "Dead Bug",
  "도어 프레임 로우": "Door Frame Row",
  "레그 익스텐션": "Leg Extension",
  "레그 컬": "Leg Curl",
  "리버스 리스트 컬": "Reverse Wrist Curl",
  "리스트 컬": "Wrist Curl",
  "맥켄지 익스텐션": "McKenzie Extension",
  "발목 당기기 (Dorsiflexion)": "Ankle Dorsiflexion",
  "발목 밀기 (Plantarflexion)": "Ankle Plantarflexion",
  "발목 밸런스 보드": "Ankle Balance Board",
  "발목 알파벳 운동": "Ankle Alphabet",
  "밴드 발목 바깥쪽 돌림 (Eversion)": "Band Ankle Eversion",
  "밴드 발목 안쪽 돌림 (Inversion)": "Band Ankle Inversion",
  버드독: "Bird Dog",
  "브릿지 (힙 레이즈)": "Glute Bridge",
  "사이드 라잉 힙 어브덕션": "Side Lying Hip Abduction",
  "사이드 레터럴 레이즈": "Side Lateral Raise",
  "사이드 플랭크": "Side Plank",
  "상부 승모근 스트레칭 (Upper Trapezius)": "Upper Trapezius Stretch",
  "손가락 스프레드": "Finger Spread",
  "손목 굽힘 스트레칭 (Flexion)": "Wrist Flexion Stretch",
  "손목 서클": "Wrist Circles",
  "손목 젖힘 스트레칭 (Extension)": "Wrist Extension Stretch",
  "손목 회전 운동 (Pronation/Supination)": "Wrist Pronation Supination",
  "숄더 서클": "Shoulder Circles",
  "숄더 쉬러그": "Shoulder Shrug",
  "숄더 프레스": "Shoulder Press",
  "슈퍼맨 운동": "Superman Exercise",
  스쿼트: "Squat",
  스텝업: "Step Up",
  "슬라이딩 레그 컬": "Sliding Leg Curl",
  "싱글 레그 데드리프트": "Single Leg Deadlift",
  "싱글 레그 스탠드": "Single Leg Stand",
  "아킬레스건 스트레칭": "Achilles Stretch",
  "앉아서 옆구리 늘리기 (Parivrtta Janu Sirsasana)": "Seated Side Stretch",
  "월 슬라이드": "Wall Slide",
  "월 싯": "Wall Sit",
  "이소메트릭 넥 프레스": "Isometric Neck Press",
  "익스터널 로테이션": "External Rotation",
  "인터널 로테이션": "Internal Rotation",
  "카프 레이즈": "Calf Raise",
  "캣 카우 스트레칭": "Cat Cow Stretch",
  "쿼드 스트레칭": "Quad Stretch",
  "크로스바디 스트레칭": "Cross Body Stretch",
  클램쉘: "Clamshell",
  "턱 당기기 (Chin Tuck)": "Chin Tuck",
  "파이어 하이드런트": "Fire Hydrant",
  "페이스 풀": "Face Pull",
  "펜듈럼 운동": "Pendulum Exercise",
  "프론 코브라": "Prone Cobra",
  플랭크: "Plank",
  "피리포미스 스트레칭": "Piriformis Stretch",
  "햄스트링 스트레칭": "Hamstring Stretch",
  "흉쇄유돌근 스트레칭 (SCM)": "SCM Stretch",
  "힙 90/90 스트레칭": "Hip 90/90 Stretch",
  "힙 써클": "Hip Circles",
  "힙 어덕션": "Hip Adduction",
  "힙 플렉서 스트레칭": "Hip Flexor Stretch",
  "힙 힌지 (굿모닝)": "Hip Hinge",
};

async function main() {
  console.log("Updating englishName for exercises...\n");

  for (const [koreanName, englishName] of Object.entries(exercises)) {
    const result = await prisma.exerciseTemplate.updateMany({
      where: { name: koreanName },
      data: { englishName: englishName },
    });

    if (result.count > 0) {
      console.log(`✅ ${koreanName} -> ${englishName}`);
    } else {
      console.log(`⚠️  Not Found: ${koreanName}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
