import { expect, it } from "vitest";
import { parseTransactionDate } from "./transactionDate";
import { createTransactionSubmission } from "./transactionIdempotency";
it("uses the input timezone instead of the server timezone", () => {
    expect(parseTransactionDate("2026-10-23", "00:30", "Asia/Ho_Chi_Minh").toISOString()).toBe("2026-10-22T17:30:00.000Z");
});
it("rejects invalid dates and nonexistent DST times", () => {
    expect(() => parseTransactionDate("2026-02-30", "10:00", "UTC")).toThrow();
    expect(() => parseTransactionDate("2026-03-08", "02:30", "America/New_York")).toThrow();
});
it("keeps the submission key on retry, rotates it for changed input", () => {
    const submit = createTransactionSubmission();
    const first = submit({ amount: 100 });
    expect(submit({ amount: 100 }).idempotencyKey).toBe(first.idempotencyKey);
    expect(submit({ amount: 101 }).idempotencyKey).not.toBe(first.idempotencyKey);
});
