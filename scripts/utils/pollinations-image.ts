/**
 * @file scripts/utils/pollinations-image.ts
 * @description Pollinations.ai를 사용한 이미지 생성 유틸리티 함수
 *
 * Pollinations.ai API를 사용하여 이미지를 생성하고 다운로드하는 함수들을 제공합니다.
 * Pollinations.ai는 무료 이미지 생성 서비스로, URL을 통해 이미지를 생성합니다.
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

/**
 * 파일명을 기반으로 고정된 seed 값을 생성합니다.
 * 같은 파일명에 대해 항상 같은 seed가 생성되어 일관된 이미지를 얻을 수 있습니다.
 *
 * @param filename - 파일명
 * @returns seed 값 (0-999999 사이의 정수)
 */
export function generateSeedFromFilename(filename: string): number {
  // 파일명을 해시하여 숫자로 변환
  const hash = crypto.createHash("md5").update(filename).digest("hex");
  // 해시의 첫 6자리를 숫자로 변환 (0-999999 범위)
  const seed = parseInt(hash.substring(0, 6), 16) % 1000000;
  return seed;
}

/**
 * Pollinations.ai URL을 생성합니다.
 * 
 * 참고: Pollinations.ai는 두 가지 엔드포인트를 제공합니다:
 * 1. https://image.pollinations.ai/prompt/{prompt} - 직접 이미지 다운로드
 * 2. https://pollinations.ai/p/{prompt} - 웹 페이지 (이미지 생성 대기)
 * 
 * 우리는 직접 이미지를 다운로드하는 엔드포인트를 사용합니다.
 *
 * @param prompt - 이미지 생성 프롬프트
 * @param seed - 이미지 생성 시드 (선택사항, 파일명 기반으로 자동 생성 가능)
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
  // 프롬프트를 URL-safe 형식으로 변환 (공백을 하이픈으로, 특수문자 제거)
  // Pollinations.ai는 프롬프트를 URL 경로로 사용하므로 특수문자 처리가 필요합니다
  let formattedPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // 특수문자 제거
    .replace(/\s+/g, "-") // 공백을 하이픈으로
    .replace(/-+/g, "-") // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, ""); // 앞뒤 하이픈 제거

  // 시드가 있으면 프롬프트에 추가 (고유성 보장)
  if (seed !== undefined) {
    formattedPrompt += `-${seed}`;
  }

  // Pollinations.ai 이미지 API 엔드포인트 사용
  // width, height, nologo 등의 파라미터는 쿼리 스트링으로 전달
  const params = new URLSearchParams({
    width: width.toString(),
    height: height.toString(),
    nologo: "true",
  });

  const url = `https://image.pollinations.ai/prompt/${formattedPrompt}?${params.toString()}`;
  return url;
}

/**
 * 지정된 시간(밀리초) 동안 대기합니다.
 *
 * @param milliseconds - 대기할 시간 (밀리초)
 */
export function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Pollinations.ai URL에서 이미지를 다운로드합니다.
 * Pollinations.ai는 이미지 생성에 시간이 걸릴 수 있으므로 재시도 로직이 포함되어 있습니다.
 *
 * @param url - Pollinations.ai 이미지 URL
 * @param maxRetries - 최대 재시도 횟수 (기본값: 5)
 * @param retryDelay - 재시도 간 대기 시간 (밀리초, 기본값: 3000)
 * @returns 이미지 Buffer와 MIME 타입
 */
export async function downloadImageFromPollinations(
  url: string,
  maxRetries: number = 5,
  retryDelay: number = 3000
): Promise<{ buffer: Buffer; mimeType: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        // 429 (Too Many Requests) 또는 503 (Service Unavailable)인 경우 재시도
        if (response.status === 429 || response.status === 503) {
          if (attempt < maxRetries) {
            console.warn(
              `⚠️  Server busy (${response.status}), retrying in ${retryDelay}ms... (attempt ${attempt}/${maxRetries})`
            );
            await wait(retryDelay);
            continue;
          }
        }
        throw new Error(
          `HTTP error! status: ${response.status} - ${response.statusText}`
        );
      }

      // Content-Type 확인
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.startsWith("image/")) {
        // 이미지가 아직 생성 중일 수 있음 (HTML 페이지가 반환될 수 있음)
        // 또는 잘못된 URL 형식일 수 있음
        if (attempt < maxRetries) {
          console.warn(
            `⚠️  Image not ready yet (got ${contentType}), retrying in ${retryDelay}ms... (attempt ${attempt}/${maxRetries})`
          );
          await wait(retryDelay);
          continue;
        }
        throw new Error(
          `Expected image but got ${contentType}. Image may not be ready yet or URL format may be incorrect.`
        );
      }

      // 이미지 다운로드
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 최소 크기 확인 (너무 작으면 이미지가 완전히 생성되지 않았을 수 있음)
      // Pollinations.ai 이미지는 일반적으로 최소 10KB 이상입니다
      if (buffer.length < 10000) {
        if (attempt < maxRetries) {
          console.warn(
            `⚠️  Image too small (${buffer.length} bytes), retrying in ${retryDelay}ms... (attempt ${attempt}/${maxRetries})`
          );
          await wait(retryDelay);
          continue;
        }
        throw new Error(`Image too small (${buffer.length} bytes) - may not be fully generated`);
      }

      // MIME 타입 결정
      let mimeType = "image/png";
      if (contentType.includes("jpeg") || contentType.includes("jpg")) {
        mimeType = "image/jpeg";
      } else if (contentType.includes("webp")) {
        mimeType = "image/webp";
      }

      return { buffer, mimeType };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        console.warn(
          `⚠️  Attempt ${attempt} failed: ${lastError.message}, retrying in ${retryDelay}ms...`
        );
        await wait(retryDelay);
      }
    }
  }

  throw new Error(
    `Failed to download image after ${maxRetries} attempts: ${lastError?.message}`
  );
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

  // 파일 확장자 결정
  let extension = ".png"; // 기본값
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    extension = ".jpg";
  } else if (mimeType.includes("webp")) {
    extension = ".webp";
  } else if (mimeType.includes("gif")) {
    extension = ".gif";
  }

  // 파일 경로에 확장자가 없으면 추가
  const finalFilePath = filePath.endsWith(extension)
    ? filePath
    : `${filePath}${extension}`;

  // Write file
  fs.writeFileSync(finalFilePath, imageBuffer);
}

/**
 * 재시도 로직이 포함된 이미지 생성 및 다운로드 함수
 *
 * @param prompt - 이미지 생성 프롬프트
 * @param filename - 파일명 (seed 생성용)
 * @param maxRetries - 최대 재시도 횟수 (기본값: 5)
 * @param retryDelay - 재시도 간 대기 시간 (밀리초, 기본값: 3000)
 * @returns 이미지 Buffer와 MIME 타입
 */
export async function generateImageWithPollinations(
  prompt: string,
  filename: string,
  maxRetries: number = 5,
  retryDelay: number = 3000
): Promise<{ buffer: Buffer; mimeType: string }> {
  // 파일명 기반으로 seed 생성 (일관된 이미지 생성을 위해)
  const seed = generateSeedFromFilename(filename);

  // Pollinations.ai URL 생성
  const url = generatePollinationsUrl(prompt, seed);

  // 이미지 다운로드
  return await downloadImageFromPollinations(url, maxRetries, retryDelay);
}
