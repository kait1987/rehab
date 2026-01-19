/**
 * @file lib/mcp/example.ts
 * @description MCP 서버 사용 예제
 *
 * 이 파일은 MCP 서버를 어떻게 사용하는지 보여주는 예제입니다.
 * 실제 구현 시 참고용으로 사용하세요.
 *
 * @example
 * ```typescript
 * import { mcpServer } from "@/lib/mcp/server";
 * import { wrapToolHandler } from "@/lib/mcp/sentry-wrapper";
 * import * as z from "zod";
 *
 * // 도구 등록 예제
 * mcpServer.registerTool(
 *   "example-tool",
 *   {
 *     title: "Example Tool",
 *     description: "An example tool",
 *     inputSchema: {
 *       input: z.string(),
 *     },
 *     outputSchema: {
 *       result: z.string(),
 *     },
 *   },
 *   wrapToolHandler("example-tool", async ({ input }) => {
 *     // 도구 로직 구현
 *     return {
 *       content: [{ type: "text", text: `Result: ${input}` }],
 *       structuredContent: { result: `Processed: ${input}` },
 *     };
 *   })
 * );
 * ```
 */

import { mcpServer } from "./server";
import * as Sentry from "@sentry/nextjs";
import * as z from "zod";

/**
 * 예제: 간단한 계산 도구
 * 
 * 이 예제는 MCP 서버에 도구를 등록하는 방법을 보여줍니다.
 * 에러 발생 시 Sentry로 자동 전송하도록 try-catch로 래핑합니다.
 */
export function registerExampleTool() {
  // 도구 핸들러 함수 정의 (Sentry 에러 추적 포함)
  const calculateHandler = async (args: {
    a: number;
    b: number;
    operation: "add" | "subtract" | "multiply" | "divide";
  }) => {
    try {
      let result: number;

      switch (args.operation) {
        case "add":
          result = args.a + args.b;
          break;
        case "subtract":
          result = args.a - args.b;
          break;
        case "multiply":
          result = args.a * args.b;
          break;
        case "divide":
          if (args.b === 0) {
            throw new Error("Division by zero");
          }
          result = args.a / args.b;
          break;
        default:
          throw new Error(`Unknown operation: ${args.operation}`);
      }

      return {
        content: [{ type: "text" as const, text: `Result: ${result}` }],
        structuredContent: { result },
      };
    } catch (error) {
      // Sentry로 에러 전송
      Sentry.captureException(error, {
        tags: {
          component: "mcp-tool",
          operation: "tool:calculate",
        },
        extra: {
          args: JSON.stringify(args),
        },
      });
      throw error;
    }
  };

  // 도구 등록
  mcpServer.registerTool(
    "calculate",
    {
      title: "Calculator",
      description: "Perform basic calculations",
      inputSchema: {
        a: z.number().describe("First number"),
        b: z.number().describe("Second number"),
        operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("Operation to perform"),
      },
      outputSchema: {
        result: z.number(),
      },
    },
    calculateHandler
  );
}

