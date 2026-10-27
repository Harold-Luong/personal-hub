import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import ExpenseIcon from "./ExpenseIcon";
import { baseIconSet } from "./base/baseIconSet";

const render = (icon, iconSet = "base") => renderToStaticMarkup(createElement(ExpenseIcon, { icon, iconSet }));
it("keeps stored aliases visually equivalent to canonical category icons", () => {
    expect(render("utensils")).toBe(render("food"));
    expect(render("momo")).toBe(render("digital-wallet"));
});
it("renders the entire persisted base icon vocabulary with SVG", () => {
    for (const icon of Object.keys(baseIconSet)) expect(render(icon)).toContain("<svg");
});
it("falls back safely for unknown keys and prototype property names", () => {
    for (const key of ["unknown", "__proto__", "constructor"]) {
        expect(render(key)).toBe(render("more"));
        expect(render(key, "emoji")).toBe(render("more", "emoji"));
    }
});
