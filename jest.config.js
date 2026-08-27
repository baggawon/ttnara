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
    // "server-only" is a Next.js build-time marker with no runtime module;
    // neutralize it so server modules can be imported under Jest.
    "^server-only$": "<rootDir>/__tests__/jest/mocks/empty.ts",
    // The jsdom env resolves bson (a prismock dep) via its "browser" export
    // condition, which points at an ESM .mjs that Jest's transform doesn't
    // cover. require.resolve runs in CJS, so it takes the package's
    // "default" -> "require" condition and yields the CommonJS build.
    "^bson$": require.resolve("bson"),
    uuid: require.resolve("uuid"),
  },
  testEnvironment: "<rootDir>/__tests__/jest/jest-environment-jsdom.ts",
  testMatch: ["**/*.test.ts?(x)"],
  // Ignore build output so it does not collide with src (haste naming clashes)
  // or get picked up as a test path.
  modulePathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/e2e/"],
  // transformIgnorePatterns: ["<rootDir>/node_modules/.+.(js|jsx)$"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
