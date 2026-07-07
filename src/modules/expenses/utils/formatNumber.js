export function toPositiveInteger(value, label) {
    const numberValue = Math.round(Math.abs(Number(value)));

    if (!Number.isSafeInteger(numberValue) || numberValue <= 0) {
        throw new Error(`${label} must be a positive integer.`);
    }
    return numberValue;
}
