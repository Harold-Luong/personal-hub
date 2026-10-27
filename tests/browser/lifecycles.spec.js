import { expect, test } from "@playwright/test";

test("camera starts in StrictMode and closes tracks on stop and unmount", async ({ page }) => {
    await page.goto("/tests/browser/fixture.html");
    await page.getByRole("button", { name: "Bật camera" }).click();
    await expect.poll(() => page.locator("video").evaluate((video) => video.srcObject?.active ?? false)).toBe(true);
    await page.evaluate(() => { window.testStream = document.querySelector("video").srcObject; });
    await page.getByRole("button", { name: "Dừng camera" }).click();
    await expect.poll(() => page.evaluate(() => window.testStream.getTracks().every((track) => track.readyState === "ended"))).toBe(true);
    await page.getByRole("button", { name: "Bật camera" }).click();
    await expect.poll(() => page.locator("video").evaluate((video) => video.srcObject?.active ?? false)).toBe(true);
    await page.evaluate(() => { window.testStream = document.querySelector("video").srcObject; });
    await page.getByRole("button", { name: "empty", exact: true }).click();
    expect(await page.evaluate(() => window.testStream.getTracks().every((track) => track.readyState === "ended"))).toBe(true);
});

test("stopping while camera permission is pending closes a late stream", async ({ page }) => {
    await page.addInitScript(() => {
        const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia = async (constraints) => {
            await new Promise((resolve) => { window.releaseCamera = resolve; });
            window.lateStream = await original(constraints);
            return window.lateStream;
        };
    });
    await page.goto("/tests/browser/fixture.html");
    await page.getByRole("button", { name: "Bật camera" }).click();
    await page.waitForFunction(() => Boolean(window.releaseCamera));
    await page.getByRole("button", { name: "Dừng camera" }).click();
    await page.evaluate(() => window.releaseCamera());
    await expect.poll(() => page.evaluate(() => window.lateStream?.getTracks().every((track) => track.readyState === "ended") ?? false)).toBe(true);
    await expect(page.getByRole("button", { name: "Bật camera" })).toBeVisible();
});

test("JSON sort keeps __proto__ in the visible result", async ({ page }) => {
    await page.goto("/tests/browser/fixture.html");
    await page.getByRole("button", { name: "json", exact: true }).click();
    const input = '{"__proto__":{"nested":true},"a":1}';
    await page.locator("textarea").first().fill(input);
    await page.getByRole("button", { name: "Sắp xếp key JSON từ A đến Z" }).click();
    expect(JSON.parse(await page.locator("textarea").nth(1).inputValue())).toEqual(JSON.parse(input));
});

test("leaving Media Cutter resets source/result state and revokes URLs", async ({ page }) => {
    await page.goto("/tests/browser/fixture.html");
    await page.getByRole("button", { name: "media", exact: true }).click();
    // Generate a small local video in Chromium; no network fixture or upload.
    const bytes = await page.evaluate(async () => {
        const canvas = document.createElement("canvas"); canvas.width = 64; canvas.height = 64;
        const stream = canvas.captureStream(10);
        const chunks = [];
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        const done = new Promise((resolve) => { recorder.onstop = resolve; });
        recorder.ondataavailable = (event) => chunks.push(event.data);
        recorder.start();
        const context = canvas.getContext("2d");
        for (let i = 0; i < 10; i += 1) {
            context.fillStyle = i % 2 ? "red" : "blue"; context.fillRect(0, 0, 64, 64);
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        recorder.stop(); await done; stream.getTracks().forEach((track) => track.stop());
        return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
    });
    await page.locator('input[type="file"]').setInputFiles({ name: "local.webm", mimeType: "video/webm", buffer: Buffer.from(bytes) });
    await expect.poll(() => page.evaluate(async () => (await import("/src/modules/media-cutter/store/useMediaCutterStore.js")).useMediaCutterStore.getState().sourceFile?.name)).toBe("local.webm");
    const url = await page.evaluate(async () => (await import("/src/modules/media-cutter/store/useMediaCutterStore.js")).useMediaCutterStore.getState().sourceUrl);
    await page.getByRole("button", { name: "empty", exact: true }).click();
    expect(await page.evaluate(async () => {
        const state = (await import("/src/modules/media-cutter/store/useMediaCutterStore.js")).useMediaCutterStore.getState();
        return { source: state.sourceFile, result: state.result, url: state.sourceUrl };
    })).toEqual({ source: null, result: null, url: "" });
    expect(await page.evaluate(async (value) => { try { await fetch(value); return false; } catch { return true; } }, url)).toBe(true);
    await page.getByRole("button", { name: "media", exact: true }).click();
    await expect(page.locator(".media-empty-state")).toBeVisible();
});
