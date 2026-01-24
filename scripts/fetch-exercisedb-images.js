/**
 * ExerciseDB API를 사용하여 운동 이미지/GIF 다운로드
 *
 * 사용법: 
 *   node scripts/fetch-exercisedb-images.js
 *   node scripts/fetch-exercisedb-images.js --start=0 --end=30
 *   node scripts/fetch-exercisedb-images.js --dry-run
 */

require("dotenv").config({ path: ".env.local" });

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const https = require("https");

const prisma = new PrismaClient();

const EXERCISE_DB_API_KEY = process.env.EXERCISE_DB_API_KEY;
const EXERCISE_DB_API_HOST = process.env.EXERCISE_DB_API_HOST || "exercisedb.p.rapidapi.com";

if (!EXERCISE_DB_API_KEY) {
  console.error("EXERCISE_DB_API_KEY 환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, "../public/images/exercises");
const PROGRESS_FILE = path.join(__dirname, "../exercise-download-progress.json");

// CLI 옵션 파싱
const args = process.argv.slice(2);
const startIndex = parseInt(args.find(a => a.startsWith('--start='))?.split('=')[1]) || 0;
const endIndex = parseInt(args.find(a => a.startsWith('--end='))?.split('=')[1]) || Infinity;
const dryRun = args.includes('--dry-run');

// 진행 상태 로드
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.warn("진행 상태 파일을 읽을 수 없습니다. 새로 시작합니다.");
      return { completed: [] };
    }
  }
  return { completed: [] };
}

// 진행 상태 저장
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

// 한글 운동명 -> 영어 운동명 매핑 (수동 매핑)
// 공백과 언더스코어 모두 지원
const KOREAN_TO_ENGLISH_MAP = {
  // 기본 운동
  "플랭크": "plank",
  "스쿼트": "squat",
  "버드독": "bird dog",
  "브릿지 (힙 레이즈)": "hip raise",
  "브릿지_힙_레이즈": "hip raise",
  "캣 카우 스트레칭": "cat cow stretch",
  "캣_카우_스트레칭": "cat cow stretch",
  "데드버그": "dead bug",
  "푸쉬업": "push up",
  "런지": "lunge",
  "사이드 런지": "side lunge",
  "사이드_런지": "side lunge",
  "힙 플렉서 스트레칭": "hip flexor stretch",
  "힙_플렉서_스트레칭": "hip flexor stretch",
  "햄스트링 스트레칭": "hamstring stretch",
  "햄스트링_스트레칭": "hamstring stretch",
  "쿼드 스트레칭": "quad stretch",
  "쿼드_스트레칭": "quad stretch",
  "아킬레스건 스트레칭": "calf stretch",
  "아킬레스건_스트레칭": "calf stretch",
  "어깨 스트레칭": "shoulder stretch",
  "어깨 스트레칭 (Shoulder Stretch)": "shoulder stretch",
  "어깨_스트레칭": "shoulder stretch",
  "넥 플렉션": "neck flexion",
  "넥_플렉션": "neck flexion",
  "넥 익스텐션": "neck extension",
  "넥_익스텐션": "neck extension",
  "숄더 쉬러그": "shoulder shrug",
  "숄더_쉬럭": "shoulder shrug",
  "숄더 프레스": "shoulder press",
  "숄더_프레스": "shoulder press",
  "바이셉 컬": "bicep curl",
  "바이셉_컬": "bicep curl",
  "트라이셉 딥": "tricep dip",
  "트라이셉_딥": "tricep dip",
  "트라이셉 익스텐션": "tricep extension",
  "트라이셉_익스텐션": "tricep extension",
  "체스트 프레스": "chest press",
  "체스트_프레스": "chest press",
  "체스트 플라이": "chest fly",
  "체스트_플라이": "chest fly",
  "시티드 로우": "seated row",
  "시티드 로우 (Seated Row)": "seated row",
  "시티드_로우": "seated row",
  "사이드 레터럴 레이즈": "lateral raise",
  "레터럴_레이즈": "lateral raise",
  "레그 컬": "leg curl",
  "레그_컬": "leg curl",
  "레그 익스텐션": "leg extension",
  "레그_익스텐션": "leg extension",
  "카프 레이즈": "calf raise",
  "카프_레이즈": "calf raise",
  "글루트 킥백": "glute kickback",
  "글루트_킥백": "glute kickback",
  "클램쉘": "clamshell",
  "힙 써클": "hip circle",
  "힙_써클": "hip circle",
  "힙 어덕션": "hip adduction",
  "힙_어덕션": "hip adduction",
  "사이드 플랭크": "side plank",
  "사이드_플랭크": "side plank",
  "슈퍼맨 운동": "superman",
  "슈퍼맨_운동": "superman",
  "월 푸쉬업": "wall push up",
  "월_푸쉬업": "wall push up",
  "월 슬라이드": "wall slide",
  "월_슬라이드": "wall slide",
  "월 싯": "wall sit",
  "월_싯": "wall sit",
  "YTWL 운동": "ytwl raise",
  "YTWL_운동": "ytwl raise",
  "손목 서클": "wrist circle",
  "손목_서클": "wrist circle",
  "손목 스트레칭": "wrist stretch",
  "손목 스트레칭 (Wrist Stretch)": "wrist stretch",
  "손목_스트레칭": "wrist stretch",
  "손목 굽힘 스트레칭": "wrist flexion",
  "손목 굽힘 스트레칭 (Flexion)": "wrist flexion",
  "손목_굽힘_스트레칭": "wrist flexion",
  "손목 젖힘 스트레칭": "wrist extension",
  "손목 젖힘 스트레칭 (Extension)": "wrist extension",
  "손목_젖힘_스트레칭": "wrist extension",
  "손목 회전 운동 (Pronation/Supination)": "wrist rotation",
  "손가락 스프레드": "finger spread",
  "손가락_스프레드": "finger spread",
  "그립 스트렝스닝": "grip strengthener",
  "테니스볼 스퀴즈": "grip",
  "테니스볼_스퀴즈": "grip",
  "발목 스트레칭": "ankle stretch",
  "발목 스트레칭 (Ankle Stretch)": "ankle stretch",
  "발목_스트레칭": "ankle stretch",
  "발목 당기기": "dorsiflexion",
  "발목 당기기 (Dorsiflexion)": "dorsiflexion",
  "발목_당기기": "dorsiflexion",
  "발목 밀기": "plantarflexion",
  "발목 밀기 (Plantarflexion)": "plantarflexion",
  "발목_밀기": "plantarflexion",
  "펜듈럼 운동": "pendulum",
  "펜들럼_운동": "pendulum",
  "페이스 풀": "face pull",
  "페이스_풀": "face pull",
  "리버스 플라이": "reverse fly",
  "리버스_플라이": "reverse fly",
  "도어 프레임 로우": "row",
  "도어_프레임_로우": "row",
  "해머 컬": "hammer curl",
  "해머_컬": "hammer curl",
  "리스트 컬": "wrist curl",
  "리스트_컬": "wrist curl",
  "리버스 리스트 컬": "reverse wrist curl",
  "리버스_리스트_컬": "reverse wrist curl",
  "프론 코브라": "cobra stretch",
  "프론_코브라": "cobra stretch",
  "싱글 레그 데드리프트": "single leg deadlift",
  "싱글_레그_데드리프트": "single leg deadlift",
  "싱글 레그 스탠드": "single leg stand",
  "싱글_레그_스탠드": "single leg stand",
  "스텝업": "step up",
  "크로스바디 스트레칭": "cross body stretch",
  "크로스바디_스트레칭": "cross body stretch",
  "슬라이딩 레그 컬": "sliding leg curl",
  "슬라이딩_레그_컬": "sliding leg curl",
  "파이어 하이드런트": "fire hydrant",
  "파이어_하이드런트": "fire hydrant",
  "힙 힌지 (굿모닝)": "hip hinge",
  "힙 힌지": "hip hinge",
  "힙_힌지": "hip hinge",
  "힙 90/90 스트레칭": "90 90 hip stretch",
  "힙_9090_스트레칭": "90 90 hip stretch",
  "차일드 포즈 (Child's Pose)": "child pose",
  "등_스트레칭": "back stretch",
  "이소메트릭 넥 프레스": "neck press",
  "이소메트릭_넥_프레스": "neck press",
  "이소메트릭 익스텐션": "isometric extension",
  "이소메트릭_익스텐션": "isometric extension",
  "이소메트릭 플렉션": "isometric flexion",
  "이소메트릭_플렉션": "isometric flexion",
  "인터널 로테이션": "internal rotation",
  "인터널_로테이션": "internal rotation",
  "익스터널 로테이션": "external rotation",
  "익스터널_로테이션": "external rotation",
  "상부 승모근 스트레칭": "upper trapezius stretch",
  "상부 승모근 스트레칭 (Upper Trapezius)": "upper trapezius stretch",
  "상부_승모근_스트레칭": "upper trapezius stretch",
  "흉쇄유돌근 스트레칭": "sternocleidomastoid stretch",
  "흉쇄유돌근 스트레칭 (SCM)": "sternocleidomastoid stretch",
  "흉쇄유돌근_스트레칭": "sternocleidomastoid stretch",
  "견갑거근 스트레칭": "levator scapulae stretch",
  "견갑거근 스트레칭 (Levator Scapulae)": "levator scapulae stretch",
  "견갑거근_스트레칭": "levator scapulae stretch",
  "턱 당기기": "chin tuck",
  "턱 당기기 (Chin Tuck)": "chin tuck",
  "턱_당기기": "chin tuck",
  "내측광근 강화 운동 (VMO)": "vmo exercise",
  "내측광근_강화_운동": "vmo exercise",
  "니 투 체스트 스트레칭": "knee to chest",
  "니_투_체스트_스트레칭": "knee to chest",
  "피리포미스 스트레칭": "piriformis stretch",
  "피리포미스_스트레칭": "piriformis stretch",
  "앉아서 옆구리 늘리기": "seated side stretch",
  "앉아서 옆구리 늘리기 (Parivrtta Janu Sirsasana)": "seated side stretch",
  "앉아서_옆구리_늘리기": "seated side stretch",
  "골반 틸트": "pelvic tilt",
  "골반_틸트": "pelvic tilt",
  "맥켄지 익스텐션": "mckenzie extension",
  "맥켄지_익스텐션": "mckenzie extension",
  // 추가 운동
  "숄더 서클": "shoulder circle",
  "발목 알파벳 운동": "ankle alphabet",
  "발목 밸런스 보드": "balance board",
  "밴드 발목 안쪽 돌림 (Inversion)": "ankle inversion",
  "밴드 발목 바깥쪽 돌림 (Eversion)": "ankle eversion",
  "사이드 라잉 힙 어브덕션": "side lying hip abduction",
  "힙 플렉서 런지 (Hip Flexor Lunge)": "hip flexor lunge"
};

/**
 * ExerciseDB API에서 운동 검색
 */
async function searchExerciseDB(query) {
  const url = `https://${EXERCISE_DB_API_HOST}/exercises/name/${encodeURIComponent(query)}?limit=5`;

  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": EXERCISE_DB_API_KEY,
      "X-RapidAPI-Host": EXERCISE_DB_API_HOST
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`JSON 파싱 오류: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

/**
 * 이미지/GIF 다운로드
 */
async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);

    https.get(url, (response) => {
      // 리다이렉트 처리
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        https.get(redirectUrl, (redirectRes) => {
          redirectRes.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve(true);
          });
        }).on("error", (err) => {
          fs.unlink(filename, () => {}); // 실패 시 파일 삭제
          reject(err);
        });
        return;
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve(true);
      });
    }).on("error", (err) => {
      fs.unlink(filename, () => {}); // 실패 시 파일 삭제
      reject(err);
    });
  });
}

/**
 * 운동 이름에서 괄호 안 영문 추출
 * 예: "플랭크 (plank)" -> "plank"
 * 예: "턱 당기기 (Chin Tuck)" -> "Chin Tuck"
 */
function extractEnglishFromParentheses(name) {
  // 괄호 안의 영문 추출: "한글 (영문)" 형식
  const match = name.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    const englishPart = match[1].trim();
    // 영문만 포함되어 있는지 확인 (한글이 섞여있지 않은지)
    if (/^[a-zA-Z0-9\s\/\-]+$/.test(englishPart)) {
      return englishPart;
    }
  }
  return null;
}

/**
 * 한글 운동명을 영어로 변환
 */
function getEnglishName(koreanName) {
  // 파일명 형식에서 확장자 제거
  let normalized = koreanName
    .replace(/\.png\.jpg$/, "")
    .replace(/\.jpg$/, "")
    .replace(/\.png$/, "")
    .replace(/\.gif$/, "")
    .trim();

  // 1순위: 괄호 안 영문 추출 (예: "플랭크 (plank)" -> "plank")
  const englishFromParentheses = extractEnglishFromParentheses(normalized);
  if (englishFromParentheses) {
    return englishFromParentheses;
  }

  // 2순위: 정확한 매칭 시도 (공백과 언더스코어 모두)
  if (KOREAN_TO_ENGLISH_MAP[normalized]) {
    return KOREAN_TO_ENGLISH_MAP[normalized];
  }

  // 3순위: 언더스코어를 공백으로 변환하여 시도
  const withSpaces = normalized.replace(/_/g, " ");
  if (KOREAN_TO_ENGLISH_MAP[withSpaces]) {
    return KOREAN_TO_ENGLISH_MAP[withSpaces];
  }

  // 4순위: 공백을 언더스코어로 변환하여 시도
  const withUnderscores = normalized.replace(/\s+/g, "_");
  if (KOREAN_TO_ENGLISH_MAP[withUnderscores]) {
    return KOREAN_TO_ENGLISH_MAP[withUnderscores];
  }

  // 5순위: 부분 매칭 시도 (키워드 기반)
  for (const [korean, english] of Object.entries(KOREAN_TO_ENGLISH_MAP)) {
    const koreanClean = korean.replace(/[()]/g, "").replace(/\s+/g, " ").trim();
    const normalizedClean = normalized.replace(/[()]/g, "").replace(/\s+/g, " ").trim();
    
    if (normalizedClean.includes(koreanClean) || koreanClean.includes(normalizedClean)) {
      return english;
    }
  }

  return null;
}

/**
 * 파일명 생성 (한글 지원)
 */
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 100);
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log("=== ExerciseDB API 이미지 다운로드 ===\n");
  
  if (dryRun) {
    console.log("⚠️  DRY RUN 모드: 실제 다운로드 없이 진행합니다.\n");
  }
  
  if (startIndex > 0 || endIndex !== Infinity) {
    console.log(`📋 범위 지정: ${startIndex} ~ ${endIndex}\n`);
  }

  // 출력 디렉토리 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 진행 상태 로드
  const progress = loadProgress();
  console.log(`📊 이전에 완료된 운동: ${progress.completed.length}개\n`);

  // DB에서 운동 템플릿 조회
  const templates = await prisma.exerciseTemplate.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      englishName: true,
      imageUrl: true,
      gifUrl: true
    },
    orderBy: { id: 'asc' }
  });

  console.log(`총 ${templates.length}개의 운동 템플릿 발견\n`);

  // 범위 필터링
  const targetTemplates = templates.slice(startIndex, endIndex);
  console.log(`처리할 운동: ${targetTemplates.length}개 (인덱스 ${startIndex} ~ ${Math.min(endIndex, templates.length) - 1})\n`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  // API 요청 제한을 위해 배치 처리 (5개씩)
  const BATCH_SIZE = 5;
  const DELAY_MS = 2000; // 2초 대기

  for (let i = 0; i < targetTemplates.length; i++) {
    const template = targetTemplates[i];
    const globalIndex = startIndex + i;
    const progressText = `[${i + 1}/${targetTemplates.length}] (전체 ${globalIndex + 1}/${templates.length})`;

    console.log(`${progressText} 처리 중: ${template.name}`);
    
    // 이미 완료된 운동인지 확인
    if (progress.completed.includes(template.id)) {
      console.log(`  ⏭️ 이미 완료됨, 스킵`);
      skipCount++;
      continue;
    }

    // 영어 이름 결정 (우선순위: 1. 이름에서 괄호 추출, 2. DB의 englishName, 3. 매핑 테이블)
    let searchQuery = null;
    
    // 1순위: 운동 이름에서 괄호 안 영문 추출 (예: "플랭크 (plank)" -> "plank")
    const englishFromParentheses = extractEnglishFromParentheses(template.name);
    if (englishFromParentheses) {
      searchQuery = englishFromParentheses.toLowerCase(); // ExerciseDB는 소문자 검색이 더 잘 됨
      console.log(`  📝 괄호에서 추출: "${englishFromParentheses}" -> "${searchQuery}"`);
    }
    
    // 2순위: DB에 저장된 englishName 사용
    if (!searchQuery && template.englishName) {
      searchQuery = template.englishName.toLowerCase();
      console.log(`  📝 DB 영문명 사용: "${searchQuery}"`);
    }
    
    // 3순위: 매핑 테이블에서 찾기
    if (!searchQuery) {
      const mappedName = getEnglishName(template.name);
      if (mappedName) {
        searchQuery = mappedName.toLowerCase();
        console.log(`  📝 매핑 테이블 사용: "${searchQuery}"`);
      }
    }

    if (!searchQuery) {
      console.log(`  ⚠️ 영어 이름 매핑 없음, 스킵`);
      skipCount++;
      continue;
    }
    
    console.log(`  🔍 최종 검색어: "${searchQuery}" (원본: "${template.name}")`);

    // 이미 파일이 있는지 확인
    const existingFile = path.join(OUTPUT_DIR, `${sanitizeFilename(template.name)}.gif`);
    if (fs.existsSync(existingFile)) {
      console.log(`  ✓ 이미 존재함, 스킵`);
      skipCount++;
      continue;
    }

    try {
      // ExerciseDB API 검색
      console.log(`  검색 중: "${searchQuery}"`);
      const results = await searchExerciseDB(searchQuery);

      // API 응답이 에러 메시지인지 확인
      if (results && results.message) {
        console.log(`  ⚠️ API 응답: ${results.message}`);
        failCount++;
        continue;
      }
      
      // API 응답이 배열이 아닐 수 있음
      let exerciseList = Array.isArray(results) ? results : (results ? [results] : []);
      
      if (exerciseList.length === 0) {
        console.log(`  ❌ 검색 결과 없음`);
        failCount++;
        continue;
      }

      // 첫 번째 결과 사용
      const exercise = exerciseList[0];
      
      // GIF URL 찾기 (여러 가능한 필드명 확인)
      const gifUrl = exercise.gifUrl || exercise.gif || 
                     (exercise.images && exercise.images[0]) ||
                     (exercise.images && exercise.images.gifUrl);

      if (!gifUrl) {
        console.log(`  ❌ GIF URL 없음`);
        failCount++;
        continue;
      }

      // GIF 다운로드
      const filename = path.join(OUTPUT_DIR, `${sanitizeFilename(template.name)}.gif`);
      console.log(`  다운로드 중: ${gifUrl.substring(0, 50)}...`);

      if (!dryRun) {
        await downloadImage(gifUrl, filename);

        // DB 업데이트 (gifUrl)
        await prisma.exerciseTemplate.update({
          where: { id: template.id },
          data: {
            gifUrl: `/images/exercises/${sanitizeFilename(template.name)}.gif`,
            englishName: exercise.name
          }
        });

        // 진행 상태 업데이트
        if (!progress.completed.includes(template.id)) {
          progress.completed.push(template.id);
          saveProgress(progress);
        }
      } else {
        console.log(`  [DRY RUN] 다운로드 예정: ${filename}`);
      }

      console.log(`  ✅ 성공: ${filename}`);
      successCount++;

    } catch (error) {
      console.log(`  ❌ 오류: ${error.message}`);
      failCount++;
    }

    // API 요청 제한 준수 (배치마다 대기)
    if ((i + 1) % BATCH_SIZE === 0 && i < targetTemplates.length - 1) {
      console.log(`\n⏳ API 제한 준수를 위해 ${DELAY_MS/1000}초 대기...\n`);
      if (!dryRun) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }
  }

  console.log("\n=== 완료 ===");
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`⏭️ 스킵: ${skipCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📊 총 완료된 운동: ${progress.completed.length}개`);
  
  if (dryRun) {
    console.log("\n⚠️  DRY RUN 모드였습니다. 실제 다운로드를 하려면 --dry-run 옵션을 제거하세요.");
  }

  await prisma.$disconnect();
}

main().catch(console.error);
