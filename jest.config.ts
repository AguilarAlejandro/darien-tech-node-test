import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'Node',
        },
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/database/prisma.ts',
    '!src/**/*.d.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 15000,
  verbose: true,
}

export default config
