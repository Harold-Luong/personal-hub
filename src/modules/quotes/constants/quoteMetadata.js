export const quoteRoutes = {
    create: "/quotes/create",
    explore: "/quotes/explore",
    favorites: "/quotes/favorites",
    home: "/quotes",
};

export const quoteStorageKeys = {
    favorites: "lang.favorite-quote-ids",
    theme: "lang.theme",
};

export const quoteThemes = {
    DARK: "dark",
    LIGHT: "light",
};

export const creatorFontOptions = [
    { id: "cormorant", label: "Cormorant", value: '"Cormorant Garamond", Georgia, serif' },
    { id: "lora", label: "Lora", value: 'Lora, Georgia, serif' },
    { id: "playfair", label: "Playfair", value: '"Playfair Display", Georgia, serif' },
];

export const creatorRatioOptions = [
    { id: "portrait", label: "Dọc 4:5" },
    { id: "story", label: "Story 9:16" },
    { id: "square", label: "Vuông 1:1" },
    { id: "landscape", label: "Ngang 16:9" },
];

export const creatorAlignmentOptions = [
    { id: "left", label: "Trái" },
    { id: "center", label: "Giữa" },
    { id: "right", label: "Phải" },
];
