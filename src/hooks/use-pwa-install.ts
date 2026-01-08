/**
 * @file use-pwa-install.ts
 * @description PWA 설치 프롬프트 훅
 *
 * 앱 설치 가능 여부를 감지하고 설치 프롬프트를 표시합니다.
 *
 * 주요 기능:
 * - beforeinstallprompt 이벤트 감지
 * - 설치 가능 여부 확인
 * - 프로그래밍 방식으로 설치 프롬프트 표시
 *
 * @dependencies
 * - react: useState, useEffect
 */

'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 이미 설치된 경우 체크 (standalone 모드)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log('[usePWAInstall] Install prompt captured');
    };

    // 앱 설치 완료 감지
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('[usePWAInstall] App installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * 설치 프롬프트 표시
   */
  const installPWA = async () => {
    if (!deferredPrompt) {
      console.log('[usePWAInstall] No install prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      console.log('[usePWAInstall] User choice:', outcome);

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[usePWAInstall] Install error:', error);
      return false;
    }
  };

  return {
    isInstallable: !!deferredPrompt && !isInstalled,
    isInstalled,
    installPWA,
  };
}
