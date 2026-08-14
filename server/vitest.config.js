import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test files share one physical test database (see src/test/dbHelper.js).
    // Running them in parallel lets one file's afterEach cleanup wipe
    // collections mid-test in another file, so keep them sequential.
    fileParallelism: false,
  },
});
