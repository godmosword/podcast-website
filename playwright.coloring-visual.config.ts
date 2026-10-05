import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig(base, {
  testMatch: /coloring-visual\.spec\.ts$/,
  workers: 2,
  // Keep reviewed coloring baselines with the site's existing visual baselines.
  snapshotPathTemplate:
    "{testDir}/visual.spec.ts-snapshots/{arg}-{projectName}-{platform}{ext}",
});
