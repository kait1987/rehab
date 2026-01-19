/**
 * @file lib/mcp/usage-example.ts
 * @description MCP 서버 사용 예제 (사용자가 요청한 스타일)
 *
 * 사용자가 요청한 코드 스타일로 MCP 서버를 사용하는 방법을 보여줍니다.
 *
 * @example
 * ```typescript
 * import { wrapMcpServerWithSentry } from "@/lib/mcp/server";
 * import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
 *
 * // 사용자가 요청한 스타일과 유사한 사용법
 * const server = wrapMcpServerWithSentry({
 *   name: "my-mcp-server",
 *   version: "1.0.0",
 * });
 *
 * // 또는 직접 McpServer를 생성하여 래핑
 * const customServer = new McpServer({
 *   name: "my-mcp-server",
 *   version: "1.0.0",
 * });
 * const wrappedServer = wrapMcpServerWithSentry({
 *   name: customServer.name,
 *   version: customServer.version,
 * });
 * ```
 */

import { wrapMcpServerWithSentry } from "./server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * 사용자가 요청한 스타일의 사용 예제
 * 
 * 원래 코드:
 * ```typescript
 * const { McpServer } = require("@modelcontextprotocol/sdk");
 * const server = Sentry.wrapMcpServerWithSentry(new McpServer({
 *   name: "my-mcp-server",
 *   version: "1.0.0",
 * }));
 * ```
 * 
 * ESM 버전 (프로젝트에서 사용하는 방식):
 */
export function createMcpServerExample() {
  // 방법 1: wrapMcpServerWithSentry 함수 사용 (권장)
  const server = wrapMcpServerWithSentry({
    name: "my-mcp-server",
    version: "1.0.0",
  });

  // 방법 2: 직접 McpServer 생성 후 래핑 (사용자 요청 스타일과 유사)
  // 주의: wrapMcpServerWithSentry는 내부적으로 새 서버를 생성하므로,
  // 기존 서버를 래핑하는 것이 아니라 새로 생성합니다.
  const wrappedServer = wrapMcpServerWithSentry({
    name: "my-mcp-server",
    version: "1.0.0",
  });

  return { server, wrappedServer };
}

