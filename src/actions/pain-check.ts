'use server';

import { prisma } from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";

/**
 * 통증 프로필 저장 Server Action
 * 
 * Clerk 인증 사용자의 통증 정보를 UserPainProfile 테이블에 저장합니다.
 * 같은 bodyPartId에 대한 기존 프로필이 있으면 업데이트하고, 없으면 새로 생성합니다.
 * 
 * @param clerkUserId Clerk 사용자 ID (클라이언트에서 전달)
 * @param data 통증 프로필 데이터
 * @returns 저장된 통증 프로필 또는 에러
 */
export async function savePainProfile(
  clerkUserId: string,
  data: {
    bodyPartId: string;
    painLevel: number;
    experienceLevel: string;
    equipmentAvailable: string[];
  }
) {
  try {
    // 클라이언트에서 전달받은 userId 검증
    if (!clerkUserId) {
      return {
        success: false,
        error: "인증이 필요합니다. 로그인 후 다시 시도해주세요.",
      };
    }

    // Clerk ID로 User 조회
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return {
        success: false,
        error: "사용자 정보를 찾을 수 없습니다. 먼저 로그인해주세요.",
      };
    }

    // 유효성 검사
    if (!data.bodyPartId) {
      return {
        success: false,
        error: "부위를 선택해주세요.",
      };
    }

    if (!data.painLevel || data.painLevel < 1 || data.painLevel > 5) {
      return {
        success: false,
        error: "통증 정도를 올바르게 선택해주세요 (1-5).",
      };
    }

    if (!data.experienceLevel) {
      return {
        success: false,
        error: "운동 경험을 선택해주세요.",
      };
    }

    // experience_level 값 검증 (rarely, weekly_1_2, weekly_3_plus)
    const validExperienceLevels = ["rarely", "weekly_1_2", "weekly_3_plus"];
    if (!validExperienceLevels.includes(data.experienceLevel)) {
      return {
        success: false,
        error: "올바른 운동 경험 값을 선택해주세요.",
      };
    }

    // BodyPart 존재 확인
    const bodyPart = await prisma.bodyPart.findUnique({
      where: { id: data.bodyPartId },
    });

    if (!bodyPart) {
      return {
        success: false,
        error: "선택한 부위를 찾을 수 없습니다.",
      };
    }

    // 기존 프로필 확인 (같은 userId + bodyPartId 조합)
    const existingProfile = await prisma.userPainProfile.findFirst({
      where: {
        userId: user.id,
        bodyPartId: data.bodyPartId,
      },
    });

    // UserPainProfile 업데이트 또는 생성
    const painProfile = existingProfile
      ? await prisma.userPainProfile.update({
          where: { id: existingProfile.id },
          data: {
            painLevel: data.painLevel,
            experienceLevel: data.experienceLevel,
            equipmentAvailable: data.equipmentAvailable,
            updatedAt: new Date(),
          },
        })
      : await prisma.userPainProfile.create({
          data: {
            userId: user.id,
            bodyPartId: data.bodyPartId,
            painLevel: data.painLevel,
            experienceLevel: data.experienceLevel,
            equipmentAvailable: data.equipmentAvailable,
          },
        });

    // 캐시 무효화 (선택사항)
    revalidatePath('/');

    return {
      success: true,
      data: painProfile,
    };
  } catch (error) {
    console.error("Save pain profile error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

