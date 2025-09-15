const nextJest = require("next/jest");

const createJestConfig =
  nextJest?.default({ dir: "./" }) ||
  nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: "./",
  });

// Add any custom config to be passed to Jest
const customJestConfig = {
  // preset: "ts-jest",
  clearMocks: true,
  setupFilesAfterEnv: ["<rootDir>/__tests__/jest/mocks/index.ts"],
  moduleNameMapper: {
    // react: "next/dist/compiled/react/cjs/react.development.js",
    // "(.*)$": "<rootDir>/src/$1",
    "^app/(.*)$": "<rootDir>/src/app/$1",
    "^helpers/(.*)$": "<rootDir>/src/helpers/$1",
    "^types/(.*)$": "<rootDir>/src/types/$1",
    "^components/(.*)$": "<rootDir>/src/components/$1",
    "^lib/(.*)$": "<rootDir>/src/lib/$1",
    "^unitTest/(.*)$": "<rootDir>/__tests__/jest/$1",
    "^testHelper/(.*)$": "<rootDir>/__tests__/helpers/$1",
    uuid: require.resolve("uuid"),
  },
  modulePaths: ["<rootDir>/src/, <rootDir>/node_modules"],
  testEnvironment: "<rootDir>/__tests__/jest/jest-environment-jsdom.ts",
  testMatch: ["**/*.test.ts?(x)"],
  // transformIgnorePatterns: ["<rootDir>/node_modules/.+.(js|jsx)$"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
