/**
 * @file use-local-favorites.ts
 * @description localStorage 기반 즐겨찾기 훅
 *
 * 비로그인 사용자를 위한 localStorage 즐겨찾기 기능을 제공합니다.
 *
 * 주요 기능:
 * - 헬스장 즐겨찾기 추가/제거
 * - 즐겨찾기 여부 확인
 * - localStorage 사용 가능 여부 감지
 *
 * @dependencies
 * - react: useState, useEffect
 */

'use client';

import { useState, useEffect } from 'react';

export interface LocalFavoriteGym {
  gymId: string;
  name: string;
  address: string;
  addedAt: string;
}

const STORAGE_KEY = 'rehab_favorites_v1';
const MAX_FAVORITES = 10;

export function useLocalFavorites() {
  const [favorites, setFavorites] = useState<LocalFavoriteGym[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);

  // 초기화: localStorage에서 즐겨찾기 불러오기
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setFavorites(JSON.parse(data));
      }
    } catch {
      console.warn('[useLocalFavorites] localStorage not available');
      setIsAvailable(false);
    }
  }, []);

  /**
   * 즐겨찾기 추가
   */
  const addFavorite = (gym: Omit<LocalFavoriteGym, 'addedAt'>) => {
    if (!isAvailable) return false;

    try {
      // 이미 존재하면 추가하지 않음
      if (favorites.some((f) => f.gymId === gym.gymId)) {
        return true;
      }

      const gymData: LocalFavoriteGym = {
        ...gym,
        addedAt: new Date().toISOString(),
      };

      const updated = [gymData, ...favorites.slice(0, MAX_FAVORITES - 1)];
      setFavorites(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      console.group('[useLocalFavorites] addFavorite');
      console.log('Added:', gymData);
      console.groupEnd();

      return true;
    } catch (error) {
      console.error('[useLocalFavorites] addFavorite error:', error);
      return false;
    }
  };

  /**
   * 즐겨찾기 제거
   */
  const removeFavorite = (gymId: string) => {
    if (!isAvailable) return false;

    try {
      const updated = favorites.filter((f) => f.gymId !== gymId);
      setFavorites(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      console.group('[useLocalFavorites] removeFavorite');
      console.log('Removed gymId:', gymId);
      console.groupEnd();

      return true;
    } catch (error) {
      console.error('[useLocalFavorites] removeFavorite error:', error);
      return false;
    }
  };

  /**
   * 즐겨찾기 여부 확인
   */
  const isFavorite = (gymId: string) => {
    return favorites.some((f) => f.gymId === gymId);
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    isAvailable,
  };
}
