# MCP 서버 설정 가이드

이 디렉토리는 Model Context Protocol (MCP) 서버와 Sentry 통합을 위한 모듈입니다.

## 설치된 패키지

- `@modelcontextprotocol/sdk`: MCP 서버 구현을 위한 SDK
- `@sentry/nextjs`: 에러 추적 및 모니터링 (이미 프로젝트에 설치됨)

## 파일 구조

- `server.ts`: MCP 서버 생성 및 Sentry 통합
- `sentry-wrapper.ts`: Sentry 에러 추적 유틸리티 함수
- `index.ts`: 모듈 진입점 (모든 export)
- `example.ts`: 사용 예제
- `usage-example.ts`: 사용자가 요청한 스타일의 사용 예제

## 사용 방법

### 기본 사용법

```typescript
import { wrapMcpServerWithSentry } from "@/lib/mcp/server";
import * as Sentry from "@sentry/nextjs";
import * as z from "zod";

// MCP 서버 생성 (Sentry 통합 포함)
const server = wrapMcpServerWithSentry({
  name: "my-mcp-server",
  version: "1.0.0",
});

// 도구 등록
server.registerTool(
  "example-tool",
  {
    title: "Example Tool",
    description: "An example tool",
    inputSchema: {
      input: z.string(),
    },
    outputSchema: {
      result: z.string(),
    },
  },
  async (args) => {
    try {
      // 도구 로직 구현
      return {
        content: [{ type: "text" as const, text: `Result: ${args.input}` }],
        structuredContent: { result: `Processed: ${args.input}` },
      };
    } catch (error) {
      // Sentry로 에러 전송
      Sentry.captureException(error, {
        tags: {
          component: "mcp-tool",
          operation: "tool:example-tool",
        },
      });
      throw error;
    }
  }
);
```

### 사용자가 요청한 스타일

원래 요청하신 코드 스타일:
```typescript
const { McpServer } = require("@modelcontextprotocol/sdk");
const server = Sentry.wrapMcpServerWithSentry(new McpServer({
  name: "my-mcp-server",
  version: "1.0.0",
}));
```

프로젝트에서 사용하는 ESM 스타일:
```typescript
import { wrapMcpServerWithSentry } from "@/lib/mcp/server";

const server = wrapMcpServerWithSentry({
  name: "my-mcp-server",
  version: "1.0.0",
});
```

## 주요 기능

### 1. `wrapMcpServerWithSentry`

MCP 서버를 생성하고 Sentry 통합을 설정합니다.

```typescript
const server = wrapMcpServerWithSentry({
  name: "my-server",
  version: "1.0.0",
});
```

### 2. 에러 추적

도구 핸들러에서 발생하는 에러는 Sentry로 자동 전송됩니다. 
에러를 수동으로 전송하려면 `Sentry.captureException`을 사용하세요.

```typescript
try {
  // 도구 로직
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: "mcp-tool",
      operation: "tool:tool-name",
    },
  });
  throw error;
}
```

## 참고 자료

- [MCP TypeScript SDK 문서](https://modelcontextprotocol.io/docs/typescript-sdk)
- [Sentry Next.js 문서](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

