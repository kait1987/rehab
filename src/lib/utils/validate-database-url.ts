/**
 * @file validate-database-url.ts
 * @description DATABASE_URL 연결 문자열 검증 유틸리티
 *
 * Prisma가 사용하는 DATABASE_URL의 유효성을 검증하고,
 * 문제가 있을 경우 명확한 에러 메시지를 제공합니다.
 */

/**
 * DATABASE_URL 검증 결과
 */
export interface DatabaseUrlValidationResult {
  /** 검증 성공 여부 */
  isValid: boolean;
  /** 에러 메시지 (검증 실패 시) */
  error?: string;
  /** 경고 메시지 (검증 성공하지만 주의사항이 있을 때) */
  warning?: string;
  /** 파싱된 연결 정보 (검증 성공 시) */
  parsed?: {
    protocol: string;
    username: string;
    host: string;
    port: number;
    database: string;
    hasPassword: boolean;
  };
}

/**
 * DATABASE_URL 연결 문자열 검증
 *
 * @param databaseUrl DATABASE_URL 환경 변수 값 (없으면 process.env.DATABASE_URL 사용)
 * @returns 검증 결과
 */
export function validateDatabaseUrl(
  databaseUrl?: string,
): DatabaseUrlValidationResult {
  const url = databaseUrl || process.env.DATABASE_URL;

  // 1. 환경 변수 존재 여부 확인
  if (!url) {
    return {
      isValid: false,
      error:
        "DATABASE_URL 환경 변수가 설정되지 않았습니다.\n" +
        "프로젝트 루트의 .env 파일에 DATABASE_URL을 설정해주세요.\n" +
        '설정 방법: README.md의 "Prisma DATABASE_URL" 섹션 참고',
    };
  }

  // 2. 빈 문자열 확인
  if (url.trim() === "") {
    return {
      isValid: false,
      error:
        "DATABASE_URL이 비어있습니다.\n" +
        ".env 파일의 DATABASE_URL 값을 확인해주세요.",
    };
  }

  // 3. 연결 문자열 형식 확인 (postgresql://로 시작해야 함)
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    return {
      isValid: false,
      error:
        "DATABASE_URL 형식이 올바르지 않습니다.\n" +
        "postgresql:// 또는 postgres://로 시작해야 합니다.\n" +
        "현재 값: " +
        url.substring(0, 20) +
        "...",
    };
  }

  // 4. URL 파싱 시도
  try {
    const parsedUrl = new URL(url);

    // 5. 호스트 확인
    if (!parsedUrl.hostname || parsedUrl.hostname.trim() === "") {
      return {
        isValid: false,
        error:
          "DATABASE_URL에 호스트(host) 정보가 없습니다.\n" +
          "연결 문자열 형식: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres\n" +
          "Supabase 연결 문자열을 올바르게 복사했는지 확인해주세요.",
      };
    }

    // 6. 사용자명 확인
    if (!parsedUrl.username || parsedUrl.username.trim() === "") {
      return {
        isValid: false,
        error:
          "DATABASE_URL에 사용자명(username)이 없습니다.\n" +
          "Supabase 연결 문자열 형식: postgresql://postgres.ggmoudegjlobgytngkgx:[PASSWORD]@[HOST]:[PORT]/postgres",
      };
    }

    // 7. 데이터베이스명 확인
    const database = parsedUrl.pathname.replace("/", "");
    if (!database || database.trim() === "") {
      return {
        isValid: false,
        error:
          "DATABASE_URL에 데이터베이스명이 없습니다.\n" +
          "연결 문자열 끝에 /postgres가 포함되어 있는지 확인해주세요.",
      };
    }

    // 8. 비밀번호 확인 (존재 여부만, 실제 값은 확인하지 않음)
    const hasPassword =
      parsedUrl.password !== undefined && parsedUrl.password !== "";

    // 9. 경고: 비밀번호가 [YOUR-PASSWORD] 같은 플레이스홀더인지 확인
    const password = parsedUrl.password || "";
    if (
      password.includes("[YOUR") ||
      password.includes("[PASSWORD") ||
      password === "" ||
      password === "YOUR_PASSWORD"
    ) {
      return {
        isValid: false,
        error:
          "DATABASE_URL에 실제 비밀번호가 설정되지 않았습니다.\n" +
          "[YOUR-PASSWORD] 또는 [PASSWORD] 부분을 Supabase 데이터베이스 비밀번호로 교체해주세요.\n" +
          "Supabase 대시보드 → Settings → Database → Connection string에서 URI 형식 복사",
      };
    }

    // 10. 포트 확인
    const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 5432;

    // 11. Supabase 호스트 패턴 확인 (선택사항, 경고만)
    const hostname = parsedUrl.hostname;
    const isSupabaseHost =
      hostname.includes("supabase.co") ||
      hostname.includes("pooler.supabase.com") ||
      hostname.includes("aws-0-ap-northeast-1.pooler.supabase.com");

    let warning: string | undefined;
    if (!isSupabaseHost) {
      warning =
        "호스트가 Supabase 형식이 아닙니다. 연결이 실패할 수 있습니다.\n" +
        "Supabase 호스트 예시: db.ggmoudegjlobgytngkgx.supabase.co 또는 aws-0-ap-northeast-1.pooler.supabase.com";
    }

    return {
      isValid: true,
      parsed: {
        protocol: parsedUrl.protocol.replace(":", ""),
        username: parsedUrl.username,
        host: hostname,
        port,
        database,
        hasPassword,
      },
      warning,
    };
  } catch (error) {
    // URL 파싱 실패
    return {
      isValid: false,
      error:
        "DATABASE_URL 파싱 실패: " +
        (error instanceof Error ? error.message : String(error)) +
        "\n" +
        "연결 문자열 형식이 올바른지 확인해주세요.\n" +
        "예시: postgresql://postgres.ggmoudegjlobgytngkgx:[PASSWORD]@db.ggmoudegjlobgytngkgx.supabase.co:5432/postgres?sslmode=require",
    };
  }
}

/**
 * DATABASE_URL 검증 및 에러 메시지 출력
 *
 * 모든 환경에서 에러 메시지를 출력합니다.
 *
 * @param databaseUrl DATABASE_URL 환경 변수 값 (없으면 process.env.DATABASE_URL 사용)
 * @returns 검증 성공 여부
 */
export function validateAndLogDatabaseUrl(databaseUrl?: string): boolean {
  const result = validateDatabaseUrl(databaseUrl);

  if (!result.isValid) {
    console.error("\n[DATABASE_URL 검증 실패]");
    console.error(result.error);
    if (result.warning) {
      console.warn("[경고]", result.warning);
    }

    // 추가 디버깅 정보 (보안 강화: 민감 정보 제외)
    const url = databaseUrl || process.env.DATABASE_URL;
    if (url) {
      console.error("\n[디버깅 정보]");
      console.error(`DATABASE_URL 길이: ${url.length}`);
      // 중요: 전체 URL이나 앞뒤 부분을 로깅하지 않음
      console.error(
        `DATABASE_URL에 @ 포함: ${url.includes("@") ? "✅" : "❌"}`,
      );
      console.error(
        `DATABASE_URL에 :// 포함: ${url.includes("://") ? "✅" : "❌"}`,
      );

      // 포트 정보만 안전하게 확인
      const hasPoolingPort = url.includes(":6543");
      const hasDirectPort = url.includes(":5432");
      console.error(
        `포트 설정: ${hasPoolingPort ? "Pooling(6543)" : hasDirectPort ? "Direct(5432)" : "기타/기본값"}`,
      );
      console.error(
        `pgbouncer 파라미터: ${url.includes("pgbouncer=true") ? "✅" : "❌"}`,
      );

      // URL 파싱 시도 (비밀번호 제외하고 호스트만 출력)
      try {
        const testUrl = new URL(url);
        console.error(`파싱된 호스트: ${testUrl.hostname}`);
        console.error(`파싱된 포트: ${testUrl.port || "(기본값)"}`);
        console.error(
          `파싱된 사용자명: ${testUrl.username ? "(존재함)" : "(없음)"}`,
        );
      } catch (parseError) {
        console.error("URL 파싱 실패: 형식이 올바르지 않습니다.");
      }
    } else {
      console.error("\n[디버깅 정보]");
      console.error("DATABASE_URL 환경 변수가 존재하지 않습니다.");
      // 환경 변수 키 목록에서도 값은 제외하고 키만 나열
      const envKeys = Object.keys(process.env).filter((key) =>
        key.includes("DATABASE"),
      );
      console.error(
        "관련 환경 변수 키:",
        envKeys.length > 0 ? envKeys.join(", ") : "(없음)",
      );
    }

    return false;
  }

  if (result.warning) {
    console.warn("[DATABASE_URL 경고]", result.warning);
  }

  if (process.env.NODE_ENV === "development" && result.parsed) {
    console.log("\n[DATABASE_URL 검증 성공]");
    console.log(`  호스트: ${result.parsed.host}`);
    console.log(`  포트: ${result.parsed.port}`);
    console.log(`  데이터베이스: ${result.parsed.database}`);
    console.log(`  사용자명: ${result.parsed.username}`);
    console.log(`  비밀번호: ${result.parsed.hasPassword ? "***" : "없음"}`);
  }

  return true;
}
