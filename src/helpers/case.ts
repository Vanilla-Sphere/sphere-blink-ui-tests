import type { TestInfo } from "@playwright/test";

/**
 * Keeps the traceability from the manual test-case sheet: every test carries
 * its case ID, priority and design trace as report annotations.
 */
export function annotateCase(testInfo: TestInfo, id: string, priority: string, trace: string): void {
  testInfo.annotations.push(
    { type: "case", description: id },
    { type: "priority", description: priority },
    { type: "trace", description: trace },
  );
}
