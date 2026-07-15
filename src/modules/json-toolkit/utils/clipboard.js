export async function copyText(text) {
    if (!navigator.clipboard?.writeText) {
        throw new Error("Browser này không hỗ trợ quyền truy cập clipboard.");
    }

    await navigator.clipboard.writeText(text);
}
