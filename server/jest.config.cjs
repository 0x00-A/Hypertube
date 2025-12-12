module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
  verbose: false,
  collectCoverage: false,
  // Run tests sequentially to avoid database race conditions
  maxWorkers: 1,
  // Increase timeout for integration tests
  testTimeout: 10000,
};
