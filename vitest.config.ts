import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // 테스트 환경
    environment: 'node',
    
    // 전역 설정
    globals: true,
    
    // 테스트 파일 패턴
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    
    // 제외 패턴
    exclude: ['node_modules', '.next', 'dist'],
    
    // 커버리지 설정
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/lib/utils/**/*.ts',
        'src/lib/algorithms/**/*.ts',
        'src/lib/services/**/*.ts',
        'src/app/api/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/index.ts',
        '**/__tests__/**',
      ],
      // 커버리지 임계값
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
    
    // 타임아웃 (ms)
    testTimeout: 10000,
    
    // 설정 파일
    setupFiles: [],
    
    // 모듈 별칭
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/types': path.resolve(__dirname, './types'),
    },
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/types': path.resolve(__dirname, './types'),
    },
  },
});
