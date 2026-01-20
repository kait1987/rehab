/**
 * @file scripts/utils/pollinations-image.ts
 * @description Pollinations.ai를 사용한 이미지 생성 유틸리티 함수
 *
 * Pollinations.ai는 무료 AI 이미지 생성 서비스를 제공합니다.
 * URL을 통해 이미지를 생성하고 다운로드할 수 있습니다.
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

/**
 * 파일명을 기반으로 고정된 seed 값을 생성합니다.
 * 동일한 파일명에 대해 항상 같은 seed가 생성되어 일관된 이미지를 보장합니다.
 *
 * @param filename - 파일명
 * @returns 0-999999 사이의 seed 값
 */
export function generateSeedFromFilename(filename: string): number {
  const hash = crypto.createHash("md5").update(filename).digest("hex");
  // 해시의 첫 6자리를 숫자로 변환
  const seed = parseInt(hash.substring(0, 6), 16) % 1000000;
  return seed;
}

/**
 * Pollinations.ai URL을 생성합니다.
 *
 * @param prompt - 이미지 생성 프롬프트
 * @param seed - 이미지 생성 시드 (선택사항, 없으면 랜덤)
 * @param width - 이미지 너비 (기본값: 1024)
 * @param height - 이미지 높이 (기본값: 1024)
 * @returns Pollinations.ai 이미지 생성 URL
 */
export function generatePollinationsUrl(
  prompt: string,
  seed?: number,
  width: number = 1024,
  height: number = 1024
): string {
  const encodedPrompt = encodeURIComponent(prompt);
  const seedParam = seed !== undefined ? `&seed=${seed}` : "";
  return `https://pollinations.ai/p/${encodedPrompt}?width=${width}&height=${height}${seedParam}&nologo=true`;
}

/**
 * URL에서 이미지를 다운로드합니다.
 * Pollinations.ai는 이미지 생성에 시간이 걸리므로, 이미지가 준비될 때까지 대기합니다.
 *
 * @param url - 이미지 URL
 * @param timeout - 타임아웃 (밀리초, 기본값: 60000)
 * @returns 이미지 데이터 Buffer
 */
export async function downloadImageFromUrl(
  url: string,
  timeout: number = 60000
): Promise<Buffer> {
  const startTime = Date.now();
  const maxWaitTime = timeout;
  const checkInterval = 2000; // 2초마다 확인

  // Pollinations.ai는 이미지 생성에 시간이 걸리므로
  // 이미지가 준비될 때까지 반복적으로 확인
  while (Date.now() - startTime < maxWaitTime) {
    const controller = new AbortController();
    const requestTimeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "image/*",
        },
      });

      clearTimeout(requestTimeout);

      if (!response.ok) {
        // 404나 다른 에러는 잠시 대기 후 재시도
        if (response.status === 404 || response.status >= 500) {
          await wait(checkInterval);
          continue;
        }
        throw new Error(
          `Failed to download image: ${response.status} ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");
      
      // HTML이 반환되면 이미지가 아직 생성 중
      if (contentType && contentType.includes("text/html")) {
        await wait(checkInterval);
        continue;
      }

      // 이미지 타입 확인
      if (!contentType || !contentType.startsWith("image/")) {
        // 이미지가 아닌 경우 잠시 대기 후 재시도
        await wait(checkInterval);
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      clearTimeout(requestTimeout);
      
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          // 타임아웃은 재시도
          await wait(checkInterval);
          continue;
        }
        // 네트워크 오류도 재시도
        if (error.message.includes("fetch failed") || error.message.includes("network")) {
          await wait(checkInterval);
          continue;
        }
        throw error;
      }
      throw new Error(`Unknown error: ${String(error)}`);
    }
  }

  throw new Error(`Image generation timeout after ${timeout}ms`);
}

/**
 * 이미지를 파일로 저장합니다.
 *
 * @param imageBuffer - 이미지 데이터 Buffer
 * @param filePath - 저장할 파일 경로
 */
export function saveImageToFile(
  imageBuffer: Buffer,
  filePath: string
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
 * Pollinations.ai에서 이미지를 생성하고 다운로드합니다.
 * 이미지 생성에 시간이 걸릴 수 있으므로 재시도 로직이 포함되어 있습니다.
 *
 * @param prompt - 이미지 생성 프롬프트
 * @param seed - 이미지 생성 시드 (선택사항)
 * @param maxRetries - 최대 재시도 횟수 (기본값: 3)
 * @param retryDelay - 재시도 간 대기 시간 (밀리초, 기본값: 5000)
 * @param downloadTimeout - 다운로드 타임아웃 (밀리초, 기본값: 60000)
 * @returns 이미지 데이터 Buffer
 */
export async function generateImageWithPollinations(
  prompt: string,
  seed?: number,
  maxRetries: number = 3,
  retryDelay: number = 5000,
  downloadTimeout: number = 60000
): Promise<Buffer> {
  const url = generatePollinationsUrl(prompt, seed);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Pollinations.ai는 이미지 생성에 시간이 걸릴 수 있으므로
      // 첫 요청 전에 잠시 대기 (이미지 생성 시작 시간 제공)
      if (attempt === 1) {
        await wait(2000);
      } else {
        await wait(retryDelay);
      }

      const imageBuffer = await downloadImageFromUrl(url, downloadTimeout);
      return imageBuffer;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        console.warn(
          `Attempt ${attempt} failed: ${lastError.message}, retrying in ${retryDelay}ms...`
        );
      }
    }
  }

  throw new Error(
    `Failed to generate image after ${maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * 재시도 로직이 포함된 이미지 생성 및 저장 함수
 *
 * @param prompt - 이미지 생성 프롬프트
 * @param filePath - 저장할 파일 경로
 * @param seed - 이미지 생성 시드 (선택사항)
 * @param maxRetries - 최대 재시도 횟수 (기본값: 5)
 * @param retryDelay - 재시도 간 대기 시간 (밀리초, 기본값: 3000)
 * @returns 성공 여부
 */
export async function generateAndSaveImageWithPollinations(
  prompt: string,
  filePath: string,
  seed?: number,
  maxRetries: number = 5,
  retryDelay: number = 3000
): Promise<boolean> {
  try {
    const imageBuffer = await generateImageWithPollinations(
      prompt,
      seed,
      maxRetries,
      retryDelay
    );
    saveImageToFile(imageBuffer, filePath);
    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate and save image: ${errorMessage}`);
  }
}

