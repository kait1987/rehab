/**
 * @file route.ts
 * @description Clerk Webhook 엔드포인트
 *
 * Clerk에서 사용자 이벤트(생성/수정/삭제)가 발생할 때
 * 호출되어 DB와 동기화합니다.
 *
 * 설정 방법:
 * 1. Clerk Dashboard → Webhooks → Add Endpoint
 * 2. URL: https://your-domain.com/api/webhooks/clerk
 * 3. Events: user.created, user.updated, user.deleted
 * 4. Signing Secret을 .env.local의 CLERK_WEBHOOK_SECRET에 저장
 */

import { prisma } from "@/lib/prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

// Clerk Webhook 이벤트 타입 정의
interface ClerkUserEvent {
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    username: string | null;
  };
  object: "event";
  type: "user.created" | "user.updated" | "user.deleted";
}

export async function POST(req: Request) {
  // Webhook Secret 확인
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Svix 헤더 가져오기
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // 헤더 검증
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing svix headers");
    return NextResponse.json(
      { error: "Missing webhook headers" },
      { status: 400 },
    );
  }

  // Request body 가져오기
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Webhook 서명 검증
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: ClerkUserEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkUserEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 },
    );
  }

  // 이벤트 타입에 따른 처리
  const eventType = evt.type;
  const { id: clerkId, email_addresses, first_name, last_name } = evt.data;

  // 이메일 주소 추출 (첫 번째 이메일 사용)
  const primaryEmail = email_addresses?.[0]?.email_address || null;
  const displayName = [first_name, last_name].filter(Boolean).join(" ") || null;

  console.log(`[Clerk Webhook] Event: ${eventType}, ClerkId: ${clerkId}`);

  try {
    switch (eventType) {
      case "user.created":
        // 새 사용자 생성
        await prisma.user.create({
          data: {
            clerkId,
            email: primaryEmail,
            name: displayName,
            displayName: displayName,
            isActive: true,
          },
        });
        console.log(`[Clerk Webhook] User created: ${clerkId}`);
        break;

      case "user.updated":
        // 사용자 정보 업데이트 (없으면 생성 - upsert)
        await prisma.user.upsert({
          where: { clerkId },
          update: {
            email: primaryEmail,
            name: displayName,
            displayName: displayName,
          },
          create: {
            clerkId,
            email: primaryEmail,
            name: displayName,
            displayName: displayName,
            isActive: true,
          },
        });
        console.log(`[Clerk Webhook] User updated: ${clerkId}`);
        break;

      case "user.deleted":
        // 사용자 비활성화 (완전 삭제 대신 soft delete)
        await prisma.user.update({
          where: { clerkId },
          data: { isActive: false },
        });
        console.log(`[Clerk Webhook] User deactivated: ${clerkId}`);
        break;

      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Clerk Webhook] Database error:", error);
    return NextResponse.json(
      { error: "Database operation failed" },
      { status: 500 },
    );
  }
}
