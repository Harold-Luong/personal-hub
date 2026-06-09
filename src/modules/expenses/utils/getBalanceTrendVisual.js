const trendVisuals = {
    up: {
        direction: "is-up",
        symbol: "\u2191",
        sparklinePath:
            "M2 45 C13 38 18 18 28 20 C38 22 39 39 49 38 C60 37 65 12 76 8",
        sparklineEndY: 8,
    },
    down: {
        direction: "is-down",
        symbol: "\u2193",
        sparklinePath:
            "M2 8 C13 14 18 34 28 32 C38 30 42 16 51 22 C61 28 66 43 76 46",
        sparklineEndY: 46,
    },
    flat: {
        direction: "is-flat",
        symbol: "\u2192",
        sparklinePath: "M2 27 C14 23 23 30 34 26 C46 22 57 30 76 26",
        sparklineEndY: 26,
    },
};

export function getBalanceTrendVisual(trend = 0) {
    if (trend > 0) {
        return trendVisuals.up;
    }

    if (trend < 0) {
        return trendVisuals.down;
    }

    return trendVisuals.flat;
}
