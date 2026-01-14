/**
 * @file use-recent-courses.ts
 * @description localStorage 기반 최근 코스 저장 훅
 *
 * 사용자가 생성한 재활 코스를 localStorage에 자동 저장합니다.
 *
 * 주요 기능:
 * - 코스 생성 시 자동 저장
 * - 최대 10개까지 저장 (오래된 것 자동 삭제)
 * - 최근 코스 목록 조회
 *
 * @dependencies
 * - react: useState, useEffect
 */

"use client";

import { useState, useEffect } from "react";

import type { MergeRequest } from "@/types/body-part-merge";

export interface LocalRecentCourse {
  id: string;
  bodyParts: string[];
  painLevel: number;
  totalDuration: number;
  exerciseCount: number;
  createdAt: string;
  requestData?: MergeRequest; // 재실행을 위한 원본 요청 데이터
}

const STORAGE_KEY = "rehab_recent_courses_v1";
const MAX_COURSES = 10;

export function useRecentCourses() {
  const [recentCourses, setRecentCourses] = useState<LocalRecentCourse[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);

  // 초기화: localStorage에서 최근 코스 불러오기
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setRecentCourses(JSON.parse(data));
      }
    } catch {
      console.warn("[useRecentCourses] localStorage not available");
      setIsAvailable(false);
    }
  }, []);

  /**
   * 코스 저장
   */
  const addCourse = (course: Omit<LocalRecentCourse, "createdAt" | "id">) => {
    if (!isAvailable) return false;

    try {
      const courseData: LocalRecentCourse = {
        id: Date.now().toString(),
        ...course,
        createdAt: new Date().toISOString(),
      };

      const updated = [courseData, ...recentCourses.slice(0, MAX_COURSES - 1)];
      setRecentCourses(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      console.group("[useRecentCourses] addCourse");
      console.log("Added:", courseData);
      console.groupEnd();

      return true;
    } catch (error) {
      console.error("[useRecentCourses] addCourse error:", error);
      return false;
    }
  };

  /**
   * 코스 삭제
   */
  const removeCourse = (id: string) => {
    if (!isAvailable) return false;

    try {
      const updated = recentCourses.filter((c) => c.id !== id);
      setRecentCourses(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error("[useRecentCourses] removeCourse error:", error);
      return false;
    }
  };

  /**
   * 전체 삭제
   */
  const clearAll = () => {
    if (!isAvailable) return false;

    try {
      setRecentCourses([]);
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("[useRecentCourses] clearAll error:", error);
      return false;
    }
  };

  return {
    recentCourses,
    addCourse,
    removeCourse,
    clearAll,
    isAvailable,
  };
}
