import { baseIconSet } from "./base/baseIconSet";
import { emojiIconSet } from "./emoji/emojiIconSet";

export const expenseIconSetIds = Object.freeze({
    BASE: "base",
    EMOJI: "emoji",
});

export const expenseIconSetIdValues = Object.freeze(Object.values(expenseIconSetIds));
export const expenseDefaultIconSet = expenseIconSetIds.EMOJI;

export const expenseIconSetOptions = Object.freeze([
    { id: expenseIconSetIds.EMOJI, label: "Emoji", example: "🏷️" },
    { id: expenseIconSetIds.BASE, label: "Scandinavian", example: "Nét tối giản" },
]);

export const expenseIconSets = Object.freeze({
    [expenseIconSetIds.BASE]: baseIconSet,
    [expenseIconSetIds.EMOJI]: emojiIconSet,
});
