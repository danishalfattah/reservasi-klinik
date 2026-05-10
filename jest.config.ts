import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          strict: true,
          esModuleInterop: true,
          paths: { '@/*': ['./src/*'] },
        },
      },
    ],
  },
  clearMocks: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
};

export default config;
