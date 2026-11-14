import { annotateCase } from "../helpers/case.js";
import { test } from "../fixtures.js";

test.describe("Errors and recovery (manual case UI-036)", () => {
  // UI-036 · P1 · viewer.md §Loading (EX-05)
  // Not automated: the case itself states that no recovery oracle has been
  // approved ("record the message, progress and recovery; do not conclude a
  // failure"). Network-fault injection needs an approved policy; observe this
  // case manually on staging per charter EX-05.
  test("[UI-036] Mất mạng khi đang tải", async () => {
    annotateCase(test.info(), "UI-036", "P1", "viewer.md §Loading; no approved recovery oracle, exploratory EX-05");
    test.skip(true, "No approved oracle for the recovery behaviour; needs fault injection on staging (EX-05).");
  });
});
