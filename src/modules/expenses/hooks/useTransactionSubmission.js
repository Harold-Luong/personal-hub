import { useRef } from "react";
import { createTransactionSubmission } from "../utils/transactionIdempotency";

export default function useTransactionSubmission(onSubmit) {
    const submission = useRef(null);
    const pending = useRef(null);
    return (payload) => {
        if (pending.current) return pending.current;
        submission.current ??= createTransactionSubmission();
        const input = submission.current(payload);
        pending.current = Promise.resolve().then(() => onSubmit(input)).finally(() => {
            pending.current = null;
        });
        return pending.current;
    };
}
