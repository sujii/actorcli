import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    reporters: ["default", "vitest-sonar-reporter"],
    outputFile: "report/test-report.xml",
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
    },
  },
});
