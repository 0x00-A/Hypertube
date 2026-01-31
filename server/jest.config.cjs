module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-inmemory-db.ts'],
  verbose: false,
  collectCoverage: false,
  // maxWorkers: 2,
  testTimeout: 30000,
};
