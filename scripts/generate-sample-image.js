/**
 * Google Gemini API를 사용한 운동 이미지 생성 샘플
 */

require("dotenv").config({ path: ".env.local" });

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
  console.error("GOOGLE_API_KEY 환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

console.log("API Key:", GOOGLE_API_KEY.substring(0, 10) + "...");

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

async function generateExerciseImage(exerciseName, exerciseDescription) {
  try {
    // Gemini 1.5 Flash (표준 모델)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `Generate a simple, clean fitness illustration showing a person performing the "${exerciseName}" exercise.

Requirements:
- Simple flat design illustration style
- Light background
- Show correct exercise form
- Single person demonstration
- Professional fitness context
- No text on image

Exercise: ${exerciseName}
Description: ${exerciseDescription}`;

    console.log(`\n이미지 생성 요청 중: ${exerciseName}...`);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["text", "image"],
      },
    });

    const response = result.response;
    console.log("응답 수신 완료");

    // 응답 구조 확인
    if (response.candidates && response.candidates[0]) {
      const parts = response.candidates[0].content.parts;

      for (const part of parts) {
        if (part.inlineData) {
          console.log("이미지 데이터 발견!");
          return {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType
          };
        }
        if (part.text) {
          console.log("텍스트 응답:", part.text.substring(0, 200));
        }
      }
    }

    throw new Error("이미지가 응답에 포함되지 않았습니다.");
  } catch (error) {
    console.error(`오류 상세:`, error);
    throw error;
  }
}

async function main() {
  const sampleExercise = {
    name: "플랭크",
    description: "엎드린 자세에서 팔꿈치와 발끝으로 몸을 지탱하며 코어 근육을 강화하는 운동"
  };

  try {
    console.log("=== Google Gemini 이미지 생성 테스트 ===");
    console.log(`운동: ${sampleExercise.name}`);
    console.log(`설명: ${sampleExercise.description}`);

    const imageData = await generateExerciseImage(
      sampleExercise.name,
      sampleExercise.description
    );

    // 이미지 저장
    const outputDir = path.join(__dirname, "../public/images/exercises");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const ext = imageData.mimeType === "image/png" ? "png" : "jpg";
    const fileName = `플랭크_sample.${ext}`;
    const filePath = path.join(outputDir, fileName);

    const buffer = Buffer.from(imageData.data, "base64");
    fs.writeFileSync(filePath, buffer);

    console.log(`\n✅ 이미지 저장 완료: ${filePath}`);
    console.log(`파일 크기: ${(buffer.length / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error("\n❌ 최종 오류:", error.message);

    // API가 이미지 생성을 지원하지 않는 경우 안내
    if (error.message.includes("not supported") ||
        error.message.includes("responseModalities") ||
        error.message.includes("이미지가 응답에 포함되지")) {
      console.log("\n========================================");
      console.log("Google Gemini API가 이미지 생성을 지원하지 않습니다.");
      console.log("대안:");
      console.log("1. Vertex AI의 Imagen 모델 사용 (Google Cloud 설정 필요)");
      console.log("2. OpenAI DALL-E API 사용");
      console.log("3. Stability AI API 사용");
      console.log("========================================");
    }
  }
}

main();
