import { expect, test } from "@playwright/test";

test("editing a transaction preserves its timezone on a device in another timezone", async ({ browser }) => {
    const context = await browser.newContext({ timezoneId: "America/Los_Angeles", viewport: { width: 1440, height: 1000 } });
    try {
        const page = await context.newPage();
        await page.goto("http://127.0.0.1:5174/tests/browser/expenses.html");
        await page.getByRole("button", { name: "Sửa giao dịch múi giờ Việt Nam", exact: true }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Lưu giao dịch", exact: true }).click();
        const payload = JSON.parse(await page.getByLabel("Dữ liệu gửi").textContent());
        expect(payload).toMatchObject({ date: "2026-10-23", time: "08:00", timezone: "Asia/Ho_Chi_Minh" });
    } finally {
        await context.close();
    }
});

test("navigation uses stable control icons and exposes the current page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/tests/browser/expenses.html");
    const nav = page.getByRole("navigation", { name: "Điều hướng MoneyCare", exact: true });
    await expect(nav.getByRole("button", { name: "Tổng quan", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(nav.locator("svg")).toHaveCount(8);
    await page.getByRole("button", { name: "Đổi bộ icon", exact: true }).click();
    await expect(nav.locator("svg")).toHaveCount(8);
    await nav.getByRole("button", { name: "Ví tiền", exact: true }).click();
    await expect(nav.getByRole("button", { name: "Ví tiền", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("button", { name: "Tổng quan", exact: true })).not.toHaveAttribute("aria-current");
});

test("dialog keeps keyboard focus inside and returns focus to its opener", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/tests/browser/expenses.html");
    const opener = page.getByRole("button", { name: "Nạp tiền tiết kiệm", exact: true });
    await opener.click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: /Số tiền/ }).fill("200000");
    const last = dialog.getByRole("button", { name: "Nạp tiền tiết kiệm", exact: true });
    await last.focus(); await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "Đóng", exact: true })).toBeFocused();
    await page.keyboard.press("Shift+Tab"); await expect(last).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused();
});

test("transfer explains missing currency-compatible wallets and submits after correcting selection", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/tests/browser/expenses.html");
    await page.getByRole("button", { name: "Nạp tiền tiết kiệm", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: /Số tiền/ }).fill("100");
    await dialog.getByRole("combobox", { name: "Từ ví chi tiêu", exact: true }).selectOption("usd");
    await expect(dialog.getByRole("status")).toContainText("Chưa có ví nhận bằng USD");
    await expect(dialog.getByRole("combobox", { name: "Đến ví tiết kiệm", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Nạp tiền tiết kiệm", exact: true })).toBeDisabled();
    await dialog.getByRole("combobox", { name: "Từ ví chi tiêu", exact: true }).selectOption("cash");
    await dialog.getByRole("button", { name: "Nạp tiền tiết kiệm", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const payload = JSON.parse(await page.getByLabel("Dữ liệu gửi").textContent());
    expect(payload).toMatchObject({ amount: 100, fromWalletId: "cash", toWalletId: "saving", savingsTransferKind: "deposit" });
    expect(payload.idempotencyKey).toBeTruthy();
});

for (const width of [320, 390, 768]) {
    test(`mobile shortcuts and transfer sheet work at ${width}px without horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto("/tests/browser/expenses.html");
        const shortcuts = page.getByRole("navigation", { name: "Quản lý tài chính", exact: true });
        await shortcuts.getByRole("button", { name: "Ví tiền", exact: true }).click();
        await expect(page.locator(".expenses-page")).toHaveAttribute("data-active-page", "wallets");
        await shortcuts.getByRole("button", { name: "Tiết kiệm", exact: true }).click();
        const dialog = page.getByRole("dialog");
        await dialog.getByRole("textbox", { name: /Số tiền/ }).fill("100000");
        await dialog.getByRole("textbox", { name: "Ghi chú", exact: true }).fill("Quỹ dự phòng");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await expect(dialog.getByRole("button", { name: "Nạp tiền tiết kiệm", exact: true })).toBeInViewport();
        await page.keyboard.press("Escape");
        await expect(shortcuts.getByRole("button", { name: "Tiết kiệm", exact: true })).toBeFocused();
    });
}

test("regular transfers explain incompatible currencies before submission", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/tests/browser/expenses.html");
    await page.getByRole("button", { name: "Thêm giao dịch", exact: true }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Chuyển khoản", exact: true }).click();
    await dialog.getByRole("combobox", { name: "Ví chuyển", exact: true }).selectOption("usd");
    await expect(dialog.getByRole("status")).toContainText("Chưa có ví nhận bằng USD");
    await expect(dialog.getByRole("button", { name: "Lưu giao dịch", exact: true })).toBeDisabled();
    await dialog.getByRole("combobox", { name: "Ví chuyển", exact: true }).selectOption("cash");
    await expect(dialog.getByRole("status")).toHaveCount(0);
    await expect(dialog.getByRole("combobox", { name: "Ví nhận", exact: true })).toHaveValue("bank");
});

test("card payment explains the empty wallet selector and displays the card currency", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/tests/browser/expenses.html");
    await page.getByRole("button", { name: "Thanh toán thẻ EUR", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("status")).toContainText("Chưa có ví thanh toán bằng EUR");
    await expect(dialog.locator(".credit-payment-dialog__card-summary")).toContainText("€");
    await expect(dialog.getByRole("button", { name: "Thanh toán", exact: true })).toBeDisabled();
});
