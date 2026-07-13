
import ancientMountains from "../assets/backgrounds/ancient-mountains.webp";
import familyDinner from "../assets/backgrounds/family-dinner.webp";
import healingMeadow from "../assets/backgrounds/healing-meadow.webp";
import lifeForest from "../assets/backgrounds/life-forest.webp";
import lonelyLake from "../assets/backgrounds/lonely-lake.webp";
import motivationSummit from "../assets/backgrounds/motivation-summit.webp";
import peaceTea from "../assets/backgrounds/peace-tea.webp";
import workDesk from "../assets/backgrounds/work-desk.webp";
import loveWildflowers from "../assets/backgrounds/love-wildflowers.webp";

export const quoteBackgrounds = {
    ancient: ancientMountains,
    family: familyDinner,
    healing: healingMeadow,
    life: lifeForest,
    lonely: lonelyLake,
    love: loveWildflowers,
    motivation: motivationSummit,
    peace: peaceTea,
    work: workDesk,
};

const rawCategories = [
    { backgroundId: "life", description: "Những suy tư giản dị về hành trình sống.", id: "life", name: "Cuộc sống" },
    { backgroundId: "healing", description: "Một khoảng thở cho những ngày cần dịu lại.", id: "healing", name: "Chữa lành" },
    { backgroundId: "ancient", description: "Mây núi, giang hồ và những giấc mộng xưa.", id: "ancient", name: "Cổ phong" },
    { backgroundId: "healing", description: "Sự tĩnh tại trong những điều rất nhỏ.", id: "peace", name: "Bình yên" },
    { backgroundId: "love", description: "Nơi ta được trở về và gọi tên là nhà.", id: "family", name: "Gia đình" },
    { backgroundId: "life", description: "Đi chậm, làm sâu và giữ lòng sáng rõ.", id: "work", name: "Công việc" },
    { backgroundId: "ancient", description: "Một chút can đảm cho bước chân kế tiếp.", id: "motivation", name: "Động lực" },
    { backgroundId: "lonely", description: "Không né tránh những khoảng trống trong lòng.", id: "lonely", name: "Cô đơn" },
];

const rawQuotes = [
    { author: "Khuyết danh", backgroundId: "life", categoryId: "life", id: "life-quiet-road", text: "Đi chậm không có nghĩa là đứng yên. Đôi khi đó là cách ta nhìn thấy con đường rõ hơn." },
    { author: "Lặng", backgroundId: "life", categoryId: "life", id: "life-small-choice", text: "Một đời rộng lớn thường đổi hướng từ một lựa chọn rất nhỏ." },
    { author: "Khuyết danh", backgroundId: "life", categoryId: "life", id: "life-carry-light", text: "Ngày sẽ nhẹ hơn khi ta biết điều gì thật sự cần được mang theo." },
    { author: "Lặng", backgroundId: "healing", categoryId: "healing", id: "healing-rest", text: "Hôm nay, nếu mỏi rồi, bạn có thể nghỉ. Bầu trời chưa từng trách một đám mây đi chậm." },
    { author: "Khuyết danh", backgroundId: "healing", categoryId: "healing", id: "healing-cracks", text: "Không phải vết nứt nào cũng cần che lại. Có nơi ánh sáng chỉ đi vào bằng con đường ấy." },
    { author: "Lặng", backgroundId: "healing", categoryId: "healing", id: "healing-gentle", text: "Hãy dịu dàng với phiên bản đang học cách bước qua những ngày khó." },
    { author: "Khuyết danh", backgroundId: "ancient", categoryId: "ancient", id: "ancient-dream", text: "Một thân, một ngựa, một giang hồ. Một giấc mộng tan, một kiếp người." },
    { author: "Lặng", backgroundId: "ancient", categoryId: "ancient", id: "ancient-cloud", text: "Mây qua đỉnh núi không lưu dấu. Người qua lòng nhau, sao dễ vô tình." },
    { author: "Khuyết danh", backgroundId: "ancient", categoryId: "ancient", id: "ancient-moon", text: "Trăng cũ còn soi bến vắng, chỉ người năm ấy chẳng quay về." },
    { author: "Lặng", backgroundId: "healing", categoryId: "peace", id: "peace-presence", text: "Bình yên không cần ồn ào để chứng minh rằng nó đang hiện diện." },
    { author: "Khuyết danh", backgroundId: "healing", categoryId: "peace", id: "peace-tea", text: "Một tách trà ấm, một căn phòng yên, thế là đủ cho một buổi chiều." },
    { author: "Lặng", backgroundId: "healing", categoryId: "peace", id: "peace-window", text: "Có những ngày hạnh phúc chỉ là mở cửa sổ và thấy lòng mình không vội." },
    { author: "Khuyết danh", backgroundId: "love", categoryId: "family", id: "family-light", text: "Nhà là nơi vẫn để lại một ngọn đèn, dù ta về muộn đến đâu." },
    { author: "Lặng", backgroundId: "love", categoryId: "family", id: "family-table", text: "Sau những chuyến đi dài, điều nhớ nhất đôi khi chỉ là một bữa cơm đủ người." },
    { author: "Khuyết danh", backgroundId: "love", categoryId: "family", id: "family-return", text: "Trưởng thành là đi thật xa rồi hiểu vì sao lòng mình luôn muốn trở về." },
    { author: "Lặng", backgroundId: "life", categoryId: "work", id: "work-depth", text: "Đừng vội làm nhiều. Hãy làm một điều đủ sâu để chính mình thấy tự hào." },
    { author: "Khuyết danh", backgroundId: "life", categoryId: "work", id: "work-seed", text: "Việc nhỏ làm đều mỗi ngày rồi cũng thành một khu vườn." },
    { author: "Lặng", backgroundId: "life", categoryId: "work", id: "work-pause", text: "Khoảng nghỉ không làm mất nhịp. Nó giữ ta đủ sức để đi đường dài." },
    { author: "Khuyết danh", backgroundId: "ancient", categoryId: "motivation", id: "motivation-step", text: "Không cần thấy hết con đường. Chỉ cần đủ can đảm cho bước chân kế tiếp." },
    { author: "Lặng", backgroundId: "ancient", categoryId: "motivation", id: "motivation-mountain", text: "Núi cao không thấp xuống, nhưng người đi mãi rồi cũng đến." },
    { author: "Khuyết danh", backgroundId: "ancient", categoryId: "motivation", id: "motivation-begin", text: "Ngày thích hợp nhất để bắt đầu là ngày ta thôi chờ mình hết sợ." },
    { author: "Lặng", backgroundId: "lonely", categoryId: "lonely", id: "lonely-room", text: "Cô đơn không phải căn phòng trống. Đó là khi chẳng biết gọi ai giữa căn phòng đầy người." },
    { author: "Khuyết danh", backgroundId: "lonely", categoryId: "lonely", id: "lonely-moon", text: "Trăng vẫn tròn trên mặt hồ vắng. Có những vẻ đẹp chỉ hiện ra khi không ai bên cạnh." },
    { author: "Lặng", backgroundId: "lonely", categoryId: "lonely", id: "lonely-listen", text: "Ở một mình đủ lâu, ta sẽ nghe được điều trái tim đã nói rất khẽ." },
    // ===== Cổ phong =====
    {
        author: "Khuyết danh",
        backgroundId: "ancient",
        categoryId: "ancient",
        id: "ancient-parting-rain",
        text: "Ai làm cho khói lên trời? Cho mưa xuống đất. Cho người biệt ly."
    },

    {
        author: "Khuyết danh",
        backgroundId: "ancient",
        categoryId: "ancient",
        id: "ancient-life-drama",
        text: "Nhân sinh như mộng, người tỉnh mộng tan. Hồng trần như kịch, người tản kịch tàn."
    },
];

export const quotes = rawQuotes.map((quote) => ({
    ...quote,
    background: quoteBackgrounds[quote.categoryId] ?? quoteBackgrounds[quote.backgroundId],
}));

export const quoteCategories = rawCategories.map((category) => ({
    ...category,
    background: quoteBackgrounds[category.id] ?? quoteBackgrounds[category.backgroundId],
    count: quotes.filter((quote) => quote.categoryId === category.id).length,
}));

export function getQuoteById(quoteId) {
    return quotes.find((quote) => quote.id === quoteId) ?? null;
}

export function getCategoryById(categoryId) {
    return quoteCategories.find((category) => category.id === categoryId) ?? null;
}
