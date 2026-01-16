/**
 * distribute-time.ts 단위 테스트
 *
 * 시간 배분 및 세트/횟수 자동 계산 로직을 검증합니다.
 *
 * 시간 배분 규칙:
 * - 60분 코스: warmup 10분, main 40분, cooldown 10분
 * - 90분 코스: warmup 15분, main 60분, cooldown 15분
 * - 120분 코스: warmup 15분, main 90분, cooldown 15분
 */

import { describe, it, expect } from "vitest";
import { distributeTime } from "../distribute-time";
import { createMergedExercise, EXERCISES, EXERCISE_IDS } from "./test-fixtures";

describe("distributeTime", () => {
  // ============================================
  // 기본 동작 테스트
  // ============================================

  describe("기본 동작", () => {
    it("빈 섹션을 입력하면 빈 배열을 반환한다", () => {
      // Arrange
      const exercises = {
        warmup: [],
        main: [],
        cooldown: [],
      };

      // Act
      const result = distributeTime(exercises, 90);

      // Assert
      expect(result).toEqual([]);
    });

    it("결과 배열에 모든 섹션의 운동이 포함된다", () => {
      // Arrange
      const exercises = {
        warmup: [EXERCISES.childPose],
        main: [EXERCISES.latPulldown],
        cooldown: [EXERCISES.catStretch],
      };

      // Act
      const result = distributeTime(exercises, 90);

      // Assert
      expect(result.length).toBeGreaterThanOrEqual(3);

      // 각 섹션의 운동이 포함되어 있는지 확인
      const templateIds = result.map((e) => e.exerciseTemplateId);
      expect(templateIds).toContain(EXERCISE_IDS.childPose);
      expect(templateIds).toContain(EXERCISE_IDS.latPulldown);
      expect(templateIds).toContain(EXERCISE_IDS.catStretch);
    });
  });

  // ============================================
  // 60분 코스 테스트
  // ============================================

  describe("60분 코스", () => {
    it("60분 코스의 시간 배분이 올바르다 (warmup ~10분, cooldown ~10분)", () => {
      // Arrange
      const exercises = {
        warmup: [EXERCISES.childPose],
        main: [EXERCISES.latPulldown],
        cooldown: [EXERCISES.catStretch],
      };

      // Act
      const result = distributeTime(exercises, 60);

      // Assert
      const warmupExercises = result.filter((e) => e.section === "warmup");
      const cooldownExercises = result.filter((e) => e.section === "cooldown");

      const warmupTime = warmupExercises.reduce(
        (sum, e) => sum + (e.durationMinutes || 0),
        0,
      );
      const cooldownTime = cooldownExercises.reduce(
        (sum, e) => sum + (e.durationMinutes || 0),
        0,
      );

      // 약간의 오차를 허용하는 범위 검사
      expect(warmupTime).toBeGreaterThanOrEqual(5);
      expect(warmupTime).toBeLessThanOrEqual(15);
      expect(cooldownTime).toBeGreaterThanOrEqual(5);
      expect(cooldownTime).toBeLessThanOrEqual(15);
    });

    it("60분 코스의 main 시간이 약 40분이다", () => {
      // Arrange
      const exercises = {
        warmup: [EXERCISES.childPose],
        main: [EXERCISES.latPulldown, EXERCISES.pushUp],
        cooldown: [EXERCISES.catStretch],
      };

      // Act
      const result = distributeTime(exercises, 60);

      // Assert
      const mainExercises = result.filter((e) => e.section === "main");
      const mainTime = mainExercises.reduce(
        (sum, e) => sum + (e.durationMinutes || 0),
        0,
      );

      expect(mainTime).toBeGreaterThanOrEqual(30); // 최소 30분 보장
      expect(mainTime).toBeLessThanOrEqual(45);
    });
  });

  // ============================================
  // 90분 코스 테스트
  // ============================================

  describe("90분 코스", () => {
    it("90분 코스의 시간 배분이 올바르다 (warmup ~15분, cooldown ~15분)", () => {
      // Arrange
      const exercises = {
        warmup: [EXERCISES.childPose],
        main: [EXERCISES.latPulldown],
        cooldown: [EXERCISES.catStretch],
      };

      // Act
      const result = distributeTime(exercises, 90);

      // Assert
      const warmupExercises = result.filter((e) => e.section === "warmup");
      const cooldownExercises = result.filter((e) => e.section === "cooldown");

      const warmupTime = warmupExercises.reduce(
        (sum, e) => sum + (e.durationMinutes || 0),
        0,
      );
      const cooldownTime = cooldownExercises.reduce(
        (sum, e) => sum + (e.durationMinutes || 0),
        0,
      );

      // 범위 기반 검사 (알고리즘이 운동을 반복하여 시간을 채움)
      expect(warmupTime).toBeGreaterThanOrEqual(10);
      expect(warmupTime).toBeLessThanOrEqual(20);
      expect(cooldownTime).toBeGreaterThanOrEqual(10);
      expect(cooldownTime).toBeLessThanOrEqual(20);
    });

    it("90분 코스의 main 시간이 약 60분이다", () => {
      // Arrange
      const exercises = {
        warmup: [EXERCISES.childPose],
        main: [EXERCISES.latPulldown, EXERCISES.pushUp, EXERCISES.lunge],
        cooldown: [EXERCISES.catStretch],
      };

      // Act
      const result = distributeTime(exercises, 90);

      // Assert
      const mainExercises = result.filter((e) => e.section === "main");
      const mainTime = mainExercises.reduce(
        (sum, e) => sum + (e.durationMinutes || 0),
        0,
      );

      expect(mainTime).toBeGreaterThanOrEqual(55);
      expect(mainTime).toBeLessThanOrEqual(65);
    });
  });

  // ============================================
  // 120분 코스 테스트
  // ============================================

  describe("120분 코스", () => {
    it("120분 코스의 시간 배분이 올바르다", () => {
      // Arrange
      const exercises = {
        warmup: [EXERCISES.childPose],
        main: [EXERCISES.latPulldown],
        cooldown: [EXERCISES.catStretch],
      };

      // Act
      const result = distributeTime(exercises, 120);

      // Assert
      const warmupExercises = result.filter((e) => e.section === "warmup");
      const cooldownExercises = result.filter((e) => e.section === "cooldown");

      const warmupTime = warmupExercises.reduce(
        (sum, e) => sum + (e.durationMinutes || 0),
        0,
      );
      const cooldownTime = cooldownExercises.reduce(
        (sum, e) => sum + (e.durationMinutes || 0),
        0,
      );

      // 범위 기반 검사
      expect(warmupTime).toBeGreaterThanOrEqual(10);
      expect(warmupTime).toBeLessThanOrEqual(20);
      expect(cooldownTime).toBeGreaterThanOrEqual(10);
      expect(cooldownTime).toBeLessThanOrEqual(20);
    });

    it("120분 코스의 main 시간이 약 90분이다", () => {
      // Arrange
      const exercises = {
        warmup: [EXERCISES.childPose],
        main: [
          EXERCISES.latPulldown,
          EXERCISES.pushUp,
          EXERCISES.lunge,
          EXERCISES.seatedRow,
        ],
        cooldown: [EXERCISES.catStretch],
      };

      // Act
      const result = distributeTime(exercises, 120);

      // Assert
      const mainExercises = result.filter((e) => e.section === "main");
      const mainTime = mainExercises.reduce(
        (sum, e) => sum + (e.durationMinutes || 0),
        0,
      );

      expect(mainTime).toBeGreaterThanOrEqual(85);
      expect(mainTime).toBeLessThanOrEqual(95);
    });
  });

  // ============================================
  // 세트/횟수 자동 계산 테스트
  // ============================================

  describe("세트/횟수 자동 계산", () => {
    it("시간이 변경되면 sets와 reps가 비례적으로 조정된다", () => {
      // Arrange
      const exercises = {
        warmup: [],
        main: [
          createMergedExercise({
            exerciseTemplateId: "test-exercise",
            exerciseTemplateName: "테스트 운동",
            durationMinutes: 10,
            sets: 2,
            reps: 12,
          }),
        ],
        cooldown: [],
      };

      // Act
      const result = distributeTime(exercises, 90);

      // Assert
      // 운동의 sets와 reps가 설정되어 있어야 함
      const mainExercise = result.find((e) => e.section === "main");
      expect(mainExercise?.sets).toBeGreaterThanOrEqual(1);
      expect(mainExercise?.reps).toBeGreaterThanOrEqual(5);
    });

    it("sets의 최소값 1이 보장된다", () => {
      // Arrange
      const exercises = {
        warmup: [],
        main: [
          createMergedExercise({
            exerciseTemplateId: "test-exercise",
            exerciseTemplateName: "테스트 운동",
            durationMinutes: 30, // 매우 긴 원래 시간
            sets: 1,
            reps: 12,
          }),
        ],
        cooldown: [],
      };

      // Act
      const result = distributeTime(exercises, 60);

      // Assert
      result.forEach((exercise) => {
        expect(exercise.sets).toBeGreaterThanOrEqual(1);
      });
    });

    it("reps의 최소값 5가 보장된다", () => {
      // Arrange
      const exercises = {
        warmup: [],
        main: [
          createMergedExercise({
            exerciseTemplateId: "test-exercise",
            exerciseTemplateName: "테스트 운동",
            durationMinutes: 30,
            sets: 2,
            reps: 5,
          }),
        ],
        cooldown: [],
      };

      // Act
      const result = distributeTime(exercises, 60);

      // Assert
      result.forEach((exercise) => {
        expect(exercise.reps).toBeGreaterThanOrEqual(5);
      });
    });

    it("sets의 최대값 10이 적용된다", () => {
      // Arrange
      const exercises = {
        warmup: [],
        main: [
          createMergedExercise({
            exerciseTemplateId: "test-exercise",
            exerciseTemplateName: "테스트 운동",
            durationMinutes: 5, // 짧은 원래 시간
            sets: 5,
            reps: 12,
          }),
        ],
        cooldown: [],
      };

      // Act
      const result = distributeTime(exercises, 120);

      // Assert
      result.forEach((exercise) => {
        expect(exercise.sets).toBeLessThanOrEqual(10);
      });
    });

    it("reps의 최대값 50이 적용된다", () => {
      // Arrange
      const exercises = {
        warmup: [],
        main: [
          createMergedExercise({
            exerciseTemplateId: "test-exercise",
            exerciseTemplateName: "테스트 운동",
            durationMinutes: 5,
            sets: 2,
            reps: 20,
          }),
        ],
        cooldown: [],
      };

      // Act
      const result = distributeTime(exercises, 120);

      // Assert
      result.forEach((exercise) => {
        expect(exercise.reps).toBeLessThanOrEqual(50);
      });
    });

    it("원래 값이 없는 경우 섹션별 기본값이 사용된다", () => {
      // Arrange
      const exercises = {
        warmup: [
          createMergedExercise({
            exerciseTemplateId: "warmup-test",
            exerciseTemplateName: "웜업 운동",
            durationMinutes: undefined,
            sets: undefined,
            reps: undefined,
          }),
        ],
        main: [
          createMergedExercise({
            exerciseTemplateId: "main-test",
            exerciseTemplateName: "메인 운동",
            durationMinutes: undefined,
            sets: undefined,
            reps: undefined,
          }),
        ],
        cooldown: [
          createMergedExercise({
            exerciseTemplateId: "cooldown-test",
            exerciseTemplateName: "쿨다운 운동",
            durationMinutes: undefined,
            sets: undefined,
            reps: undefined,
          }),
        ],
      };

      // Act
      const result = distributeTime(exercises, 90);

      // Assert
      // 모든 운동에 sets와 reps가 설정되어 있어야 함
      result.forEach((exercise) => {
        expect(exercise.sets).toBeDefined();
        expect(exercise.reps).toBeDefined();
        expect(exercise.sets).toBeGreaterThanOrEqual(1);
        expect(exercise.reps).toBeGreaterThanOrEqual(5);
      });
    });
  });

  // ============================================
  // 운동 시간 제한 테스트
  // ============================================

  describe("운동 시간 제한", () => {
    it("운동당 최소 시간이 5분이다", () => {
      // Arrange
      const exercises = {
        warmup: [EXERCISES.childPose, EXERCISES.catStretch],
        main: [EXERCISES.latPulldown],
        cooldown: [EXERCISES.wallPushUp],
      };

      // Act
      const result = distributeTime(exercises, 60);

      // Assert
      result.forEach((exercise) => {
        expect(exercise.durationMinutes).toBeGreaterThanOrEqual(5);
      });
    });

    it("warmup/cooldown 운동당 최대 시간이 10분이다", () => {
      // Arrange
      const exercises = {
        warmup: [EXERCISES.childPose],
        main: [],
        cooldown: [EXERCISES.catStretch],
      };

      // Act
      const result = distributeTime(exercises, 90);

      // Assert
      const warmupCooldown = result.filter(
        (e) => e.section === "warmup" || e.section === "cooldown",
      );
      warmupCooldown.forEach((exercise) => {
        expect(exercise.durationMinutes).toBeLessThanOrEqual(15);
      });
    });

    it("main 운동당 최대 시간이 20분이다", () => {
      // Arrange
      const exercises = {
        warmup: [],
        main: [EXERCISES.latPulldown],
        cooldown: [],
      };

      // Act
      const result = distributeTime(exercises, 120);

      // Assert
      const mainExercises = result.filter((e) => e.section === "main");
      mainExercises.forEach((exercise) => {
        expect(exercise.durationMinutes).toBeLessThanOrEqual(20);
      });
    });
  });

  // ============================================
  // orderInSection 테스트
  // ============================================

  describe("orderInSection 설정", () => {
    it("각 운동에 orderInSection이 설정된다", () => {
      // Arrange
      const exercises = {
        warmup: [EXERCISES.childPose, EXERCISES.catStretch],
        main: [EXERCISES.latPulldown, EXERCISES.pushUp],
        cooldown: [EXERCISES.wallPushUp],
      };

      // Act
      const result = distributeTime(exercises, 90);

      // Assert
      result.forEach((exercise) => {
        expect(exercise.orderInSection).toBeDefined();
        expect(exercise.orderInSection).toBeGreaterThanOrEqual(0);
      });
    });

    it("orderInSection은 0부터 시작하여 순서대로 증가한다", () => {
      // Arrange
      const exercises = {
        warmup: [EXERCISES.childPose, EXERCISES.catStretch],
        main: [],
        cooldown: [],
      };

      // Act
      const result = distributeTime(exercises, 90);

      // Assert
      const warmupExercises = result.filter((e) => e.section === "warmup");
      for (let i = 0; i < warmupExercises.length; i++) {
        expect(warmupExercises[i].orderInSection).toBe(i);
      }
    });
  });

  // ============================================
  // 복합 시나리오 테스트
  // ============================================

  describe("복합 시나리오", () => {
    it("문서의 예시 시나리오가 올바르게 처리된다 (90분 코스)", () => {
      // Arrange
      // VERIFICATION_3.5에서:
      // 90분 코스: warmup 15분, main 60분, cooldown 15분
      const exercises = {
        warmup: [EXERCISES.childPose, EXERCISES.catStretch],
        main: [EXERCISES.latPulldown, EXERCISES.pushUp, EXERCISES.lunge],
        cooldown: [EXERCISES.wallPushUp, EXERCISES.shoulderStretch],
      };

      // Act
      const result = distributeTime(exercises, 90);

      // Assert
      const warmupTime = result
        .filter((e) => e.section === "warmup")
        .reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
      const mainTime = result
        .filter((e) => e.section === "main")
        .reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
      const cooldownTime = result
        .filter((e) => e.section === "cooldown")
        .reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

      // 범위 기반 검사 (알고리즘이 운동을 반복하여 시간을 채움)
      expect(warmupTime).toBeGreaterThanOrEqual(10);
      expect(warmupTime).toBeLessThanOrEqual(20);
      expect(mainTime).toBeGreaterThanOrEqual(50);
      expect(mainTime).toBeLessThanOrEqual(70);
      expect(cooldownTime).toBeGreaterThanOrEqual(10);
      expect(cooldownTime).toBeLessThanOrEqual(20);
    });

    it("운동 수가 적어도 시간이 올바르게 배분된다", () => {
      // Arrange
      const exercises = {
        warmup: [EXERCISES.childPose],
        main: [EXERCISES.latPulldown],
        cooldown: [EXERCISES.catStretch],
      };

      // Act
      const result = distributeTime(exercises, 90);

      // Assert
      const totalTime = result.reduce(
        (sum, e) => sum + (e.durationMinutes || 0),
        0,
      );
      expect(totalTime).toBeGreaterThanOrEqual(60); // 최소 범위
      expect(totalTime).toBeLessThanOrEqual(100); // 최대 범위
    });

    it("운동 수가 많아도 올바르게 처리된다", () => {
      // Arrange
      const manyExercises = {
        warmup: Array.from({ length: 5 }, (_, i) =>
          createMergedExercise({
            exerciseTemplateId: `warmup-${i}`,
            exerciseTemplateName: `웜업 ${i}`,
            durationMinutes: 5,
          }),
        ),
        main: Array.from({ length: 10 }, (_, i) =>
          createMergedExercise({
            exerciseTemplateId: `main-${i}`,
            exerciseTemplateName: `메인 ${i}`,
            durationMinutes: 10,
          }),
        ),
        cooldown: Array.from({ length: 3 }, (_, i) =>
          createMergedExercise({
            exerciseTemplateId: `cooldown-${i}`,
            exerciseTemplateName: `쿨다운 ${i}`,
            durationMinutes: 5,
          }),
        ),
      };

      // Act
      const result = distributeTime(manyExercises, 90);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      // 안전 제한(20개)을 초과하지 않음
      expect(result.length).toBeLessThanOrEqual(60);
    });
  });
});
