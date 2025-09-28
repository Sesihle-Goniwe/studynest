module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/setup-jest.ts',   // ← only your setup file
  ],
  collectCoverage: true,
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@angular|@firebase|firebase|marked)'
  ],
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],
  testMatch: ['**/?(*.)+(spec).ts'],
};
