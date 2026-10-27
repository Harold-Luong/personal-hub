import { defineConfig } from "@playwright/test";
export default defineConfig({
    testDir: "./tests/browser", testMatch: "**/*.spec.js", workers: 1, timeout: 60000,
    use: {
        baseURL: "http://127.0.0.1:5174",
        launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
    },
    webServer: { command: "npm run dev -- --host 127.0.0.1 --port 5174", url: "http://127.0.0.1:5174/tests/browser/fixture.html", reuseExistingServer: false },
});
