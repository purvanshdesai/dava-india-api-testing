// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Only pick up co-located tests
  testMatch: ['**/*.test.ts'],
  // Don’t traverse into build outputs
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  // Keep transform light
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        diagnostics: false // skip TS diagnostics in Jest
      }
    ]
  },
  // Coverage is memory-hungry; enable only when needed
  collectCoverageFrom: ['**/*.ts', '!**/*.test.ts', '!jest.config.ts', '!**/dist/**', '!**/build/**'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  clearMocks: true,
  // Optional: further reduce parallelism
  maxWorkers: 1
}

export default config
