/**
 * @file scripts/utils/gemini-image.ts
 * @description Gemini API를 사용한 이미지 생성 유틸리티 함수
 *
 * Gemini API를 호출하여 이미지를 생성하고, base64 데이터를 처리하는 함수들을 제공합니다.
 */

import * as fs from "fs";
import * as path from "path";

/**
 * Gemini API 응답 타입
 */
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          data: string; // base64 encoded image
          mimeType: string;
        };
        text?: string;
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

/**
 * Gemini API를 호출하여 이미지를 생성합니다.
 *
 * @param prompt - 이미지 생성 프롬프트
 * @param apiKey - Gemini API 키
 * @returns base64로 인코딩된 이미지 데이터와 MIME 타입
 */
export async function generateImageWithGemini(
  prompt: string,
  apiKey: string
): Promise<{ base64Data: string; mimeType: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Generate an image based on this prompt: ${prompt}`,
          },
        ],
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini API error (${response.status}): ${errorText}`
    );
  }

  const data: GeminiResponse = await response.json();

  // Check for API errors
  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`);
  }

  // Extract base64 image data
  if (
    data.candidates &&
    data.candidates[0]?.content?.parts?.[0]?.inlineData
  ) {
    const inlineData = data.candidates[0].content.parts[0].inlineData;
    return {
      base64Data: inlineData.data,
      mimeType: inlineData.mimeType || "image/png",
    };
  }

  throw new Error("No image data found in Gemini API response");
}

/**
 * Base64 데이터를 디코딩하여 Buffer로 변환합니다.
 *
 * @param base64Data - Base64로 인코딩된 이미지 데이터
 * @returns 디코딩된 이미지 Buffer
 */
export function decodeBase64Image(base64Data: string): Buffer {
  return Buffer.from(base64Data, "base64");
}

/**
 * 이미지를 파일로 저장합니다.
 *
 * @param imageBuffer - 이미지 데이터 Buffer
 * @param filePath - 저장할 파일 경로
 * @param mimeType - 이미지 MIME 타입 (확장자 결정용)
 */
export function saveImageToFile(
  imageBuffer: Buffer,
  filePath: string,
  mimeType: string = "image/png"
): void {
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(filePath, imageBuffer);
}

/**
 * Rate limiting을 위한 대기 함수
 *
 * @param milliseconds - 대기할 시간 (밀리초)
 */
export function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * 재시도 로직이 포함된 이미지 생성 함수
 *
 * @param prompt - 이미지 생성 프롬프트
 * @param apiKey - Gemini API 키
 * @param maxRetries - 최대 재시도 횟수 (기본값: 3)
 * @param retryDelay - 재시도 간 대기 시간 (밀리초, 기본값: 2000)
 * @returns base64로 인코딩된 이미지 데이터와 MIME 타입
 */
export async function generateImageWithRetry(
  prompt: string,
  apiKey: string,
  maxRetries: number = 3,
  retryDelay: number = 2000
): Promise<{ base64Data: string; mimeType: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateImageWithGemini(prompt, apiKey);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        console.warn(
          `Attempt ${attempt} failed, retrying in ${retryDelay}ms...`
        );
        await wait(retryDelay);
      }
    }
  }

  throw new Error(
    `Failed to generate image after ${maxRetries} attempts: ${lastError?.message}`
  );
}

