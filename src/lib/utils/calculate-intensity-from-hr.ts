/**
 * P3-W2-02: 심박 기반 강도 조정 유틸리티
 * 
 * Karvonen 공식을 사용하여 목표 심박 Zone을 계산합니다.
 */

export type HeartRateZone = 'recovery' | 'fat_burn' | 'cardio' | 'peak';
export type RehabPhase = 'initial' | 'recovery' | 'strengthening';

export interface HeartRateInput {
  /** 휴식 심박 (bpm) */
  restingHR: number;
  /** 최대 심박 (없으면 220-나이로 추정, 나이도 없으면 기본값 사용) */
  maxHR?: number;
  /** 사용자 나이 (maxHR 계산용) */
  age?: number;
  /** 재활 단계 */
  rehabPhase?: RehabPhase;
}

export interface HeartRateZoneRange {
  zone: HeartRateZone;
  minHR: number;
  maxHR: number;
  percentRange: [number, number];
}

export interface HeartRateIntensityResult {
  /** 사용된 최대 심박 */
  maxHR: number;
  /** 심박 예비량 (HRR) */
  heartRateReserve: number;
  /** 모든 Zone 범위 */
  zones: HeartRateZoneRange[];
  /** 재활 단계에 따른 권장 Zone */
  recommendedZone: HeartRateZone;
  /** 허용되지 않는 Zone (rehabPhase에 따라) */
  restrictedZones: HeartRateZone[];
  /** 권장 심박 범위 */
  recommendedHRRange: { min: number; max: number };
}

// Zone별 HRR 백분율 범위
const ZONE_PERCENTAGES: Record<HeartRateZone, [number, number]> = {
  recovery: [0.50, 0.60],
  fat_burn: [0.60, 0.70],
  cardio: [0.70, 0.80],
  peak: [0.80, 0.90]
};

// 재활 단계별 허용 Zone
const PHASE_ALLOWED_ZONES: Record<RehabPhase, HeartRateZone[]> = {
  initial: ['recovery'],
  recovery: ['recovery', 'fat_burn'],
  strengthening: ['recovery', 'fat_burn', 'cardio']
};

/**
 * Karvonen 공식으로 목표 심박 계산
 * Target HR = ((Max HR − Resting HR) × %Intensity) + Resting HR
 */
function calculateTargetHR(restingHR: number, maxHR: number, intensity: number): number {
  const hrr = maxHR - restingHR;
  return Math.round(hrr * intensity + restingHR);
}

/**
 * 심박 기반 운동 강도 Zone 계산
 */
export function calculateIntensityFromHR(input: HeartRateInput): HeartRateIntensityResult {
  const { restingHR, age, rehabPhase = 'recovery' } = input;
  
  // 최대 심박 결정 (제공된 값 > 나이 기반 > 기본값)
  let maxHR = input.maxHR;
  if (!maxHR) {
    if (age) {
      maxHR = 220 - age;
    } else {
      maxHR = 190; // 기본값 (약 30세 가정)
    }
  }

  const heartRateReserve = maxHR - restingHR;

  // 각 Zone의 HR 범위 계산
  const zones: HeartRateZoneRange[] = (Object.keys(ZONE_PERCENTAGES) as HeartRateZone[]).map(zone => {
    const [minPercent, maxPercent] = ZONE_PERCENTAGES[zone];
    return {
      zone,
      minHR: calculateTargetHR(restingHR, maxHR!, minPercent),
      maxHR: calculateTargetHR(restingHR, maxHR!, maxPercent),
      percentRange: [minPercent * 100, maxPercent * 100] as [number, number]
    };
  });

  // 재활 단계에 따른 허용/제한 Zone
  const allowedZones = PHASE_ALLOWED_ZONES[rehabPhase];
  const allZones: HeartRateZone[] = ['recovery', 'fat_burn', 'cardio', 'peak'];
  const restrictedZones = allZones.filter(z => !allowedZones.includes(z));

  // 권장 Zone (허용된 것 중 가장 높은 강도)
  const recommendedZone = allowedZones[allowedZones.length - 1];
  const recommendedZoneData = zones.find(z => z.zone === recommendedZone)!;

  return {
    maxHR,
    heartRateReserve,
    zones,
    recommendedZone,
    restrictedZones,
    recommendedHRRange: {
      min: recommendedZoneData.minHR,
      max: recommendedZoneData.maxHR
    }
  };
}

/**
 * 현재 심박이 어느 Zone에 해당하는지 판단
 */
export function getCurrentZone(currentHR: number, zones: HeartRateZoneRange[]): HeartRateZone | 'below' | 'above' {
  for (const zone of zones) {
    if (currentHR >= zone.minHR && currentHR <= zone.maxHR) {
      return zone.zone;
    }
  }
  
  if (currentHR < zones[0].minHR) return 'below';
  return 'above';
}

/**
 * 재활 단계에서 해당 Zone이 허용되는지 확인
 */
export function isZoneAllowed(zone: HeartRateZone, rehabPhase: RehabPhase): boolean {
  return PHASE_ALLOWED_ZONES[rehabPhase].includes(zone);
}
