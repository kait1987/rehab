/**
 * @file lib/mcp/server.ts
 * @description MCP 서버 설정 및 Sentry 통합
 *
 * Model Context Protocol 서버를 생성하고 Sentry로 에러 추적을 통합합니다.
 *
 * 주요 기능:
 * 1. MCP 서버 인스턴스 생성
 * 2. Sentry를 통한 에러 추적 및 모니터링
 * 3. 에러 핸들링 래퍼 함수 제공
 *
 * @dependencies
 * - @modelcontextprotocol/sdk: MCP 서버 구현
 * - @sentry/nextjs: 에러 추적 및 모니터링
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as Sentry from "@sentry/nextjs";

/**
 * MCP 서버를 Sentry로 래핑하는 헬퍼 함수
 * 
 * MCP 서버를 생성하고 Sentry 에러 추적을 위한 설정을 추가합니다.
 * 실제 에러 추적은 도구 핸들러에서 wrapToolHandler를 사용하여 처리합니다.
 * 
 * @param serverConfig - MCP 서버 설정 옵션
 * @returns Sentry로 감싸진 MCP 서버 인스턴스
 */
export function wrapMcpServerWithSentry(
  serverConfig: {
    name: string;
    version: string;
  }
): McpServer {
  // MCP 서버 생성
  const server = new McpServer({
    name: serverConfig.name,
    version: serverConfig.version,
  });

  // 서버 정보를 Sentry에 태그로 추가
  Sentry.setTag("mcp-server-name", serverConfig.name);
  Sentry.setTag("mcp-server-version", serverConfig.version);

  return server;
}

/**
 * 기본 MCP 서버 인스턴스 생성
 * 
 * 프로젝트 전역에서 사용할 기본 MCP 서버를 생성합니다.
 */
export const mcpServer = wrapMcpServerWithSentry({
  name: "rehap-mcp-server",
  version: "1.0.0",
});

