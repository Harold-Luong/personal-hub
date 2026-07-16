
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
    {
        backgroundId: "life",
        description: "Những suy tư giản dị về hành trình sống.",
        id: "life",
        name: "Cuộc sống",
    },
    {
        backgroundId: "healing",
        description: "Một khoảng thở cho những ngày cần dịu lại.",
        id: "healing",
        name: "Chữa lành",
    },
    {
        backgroundId: "ancient",
        description: "Mây núi, giang hồ và những giấc mộng xưa.",
        id: "ancient",
        name: "Cổ phong",
    },
    {
        backgroundId: "peace",
        description: "Sự tĩnh tại trong những điều rất nhỏ.",
        id: "peace",
        name: "Bình yên",
    },
    {
        backgroundId: "family",
        description: "Nơi ta được trở về và gọi tên là nhà.",
        id: "family",
        name: "Gia đình",
    },
    {
        backgroundId: "work",
        description: "Đi chậm, làm sâu và giữ lòng sáng rõ.",
        id: "work",
        name: "Công việc",
    },
    {
        backgroundId: "motivation",
        description: "Một chút can đảm cho bước chân kế tiếp.",
        id: "motivation",
        name: "Động lực",
    },
    {
        backgroundId: "lonely",
        description: "Không né tránh những khoảng trống trong lòng.",
        id: "lonely",
        name: "Cô đơn",
    },
];

const rawQuotes = [
    // ===== Cuộc sống =====
    { id: "life-quiet-road", categoryId: "life", backgroundId: "life", author: "Khuyết danh", text: "Đi chậm không có nghĩa là đứng yên. Đôi khi đó là cách ta nhìn thấy con đường rõ hơn." },
    { id: "life-small-choice", categoryId: "life", backgroundId: "life", author: "Lặng", text: "Một đời rộng lớn thường đổi hướng từ một lựa chọn rất nhỏ." },
    { id: "life-carry-light", categoryId: "life", backgroundId: "life", author: "Khuyết danh", text: "Ngày sẽ nhẹ hơn khi ta biết điều gì thật sự cần được mang theo." },
    { id: "life-own-pace", categoryId: "life", backgroundId: "life", author: "Lặng", text: "Mỗi người có một nhịp sống riêng. Nở muộn vẫn là nở, miễn là đừng quên hướng về phía có ánh sáng." },
    { id: "life-open-window", categoryId: "life", backgroundId: "life", author: "Lặng", text: "Khi một cánh cửa khép lại, đôi khi điều cần làm không phải tìm cửa khác, mà là mở một ô cửa sổ." },
    { id: "life-enough", categoryId: "life", backgroundId: "life", author: "Lặng", text: "Biết đủ không làm cuộc đời nhỏ đi. Nó chỉ giúp ta nhận ra mình đã có nhiều đến thế nào." },
    { id: "life-seasons", categoryId: "life", backgroundId: "life", author: "Lặng", text: "Không mùa nào ở lại mãi. Ngày buồn cũng chỉ là một mùa đang đi qua." },
    { id: "life-light-luggage", categoryId: "life", backgroundId: "life", author: "Lặng", text: "Đường dài không đáng sợ bằng hành lý quá nặng. Có những điều buông xuống mới thật sự là tiến lên." },
    { id: "life-kindness-return", categoryId: "life", backgroundId: "life", author: "Lặng", text: "Điều tử tế trao đi có thể không quay về từ người cũ, nhưng thường trở lại vào lúc ta cần nhất." },
    { id: "life-present-day", categoryId: "life", backgroundId: "life", author: "Lặng", text: "Ta thường chờ một ngày đẹp trời, rồi quên rằng hôm nay cũng đang là một ngày của đời mình." },
    { id: "life-river-bend", categoryId: "life", backgroundId: "life", author: "Lặng", text: "Con sông không ngừng chảy chỉ vì gặp một khúc quanh. Cuộc đời cũng vậy." },

    // ===== Chữa lành =====
    { id: "healing-rest", categoryId: "healing", backgroundId: "healing", author: "Lặng", text: "Hôm nay, nếu mỏi rồi, bạn có thể nghỉ. Bầu trời chưa từng trách một đám mây đi chậm." },
    { id: "healing-cracks", categoryId: "healing", backgroundId: "healing", author: "Khuyết danh", text: "Không phải vết nứt nào cũng cần che lại. Có nơi ánh sáng chỉ đi vào bằng con đường ấy." },
    { id: "healing-gentle", categoryId: "healing", backgroundId: "healing", author: "Lặng", text: "Hãy dịu dàng với phiên bản đang học cách bước qua những ngày khó." },
    { id: "healing-breathe", categoryId: "healing", backgroundId: "healing", author: "Lặng", text: "Thở chậm một chút. Không phải chuyện gì cũng cần được giải quyết trong cùng một ngày." },
    { id: "healing-scar", categoryId: "healing", backgroundId: "healing", author: "Lặng", text: "Vết sẹo không kể rằng ta đã yếu đuối. Nó kể rằng ta đã ở lại đến khi vết thương lành." },
    { id: "healing-slow-morning", categoryId: "healing", backgroundId: "healing", author: "Lặng", text: "Một buổi sáng bắt đầu chậm vẫn có thể dẫn đến một ngày tốt lành." },
    { id: "healing-self-forgive", categoryId: "healing", backgroundId: "healing", author: "Lặng", text: "Tha thứ cho mình không xóa đi lỗi cũ. Nó trả lại cho ta quyền sống tốt hơn từ hôm nay." },
    { id: "healing-rain-pass", categoryId: "healing", backgroundId: "healing", author: "Lặng", text: "Cơn mưa nào rồi cũng nhẹ hạt. Hãy cho lòng mình thêm một chút thời gian." },
    { id: "healing-soft-heart", categoryId: "healing", backgroundId: "healing", author: "Lặng", text: "Giữ một trái tim mềm giữa những ngày khắc nghiệt cũng là một dạng mạnh mẽ." },
    { id: "healing-new-leaf", categoryId: "healing", backgroundId: "healing", author: "Lặng", text: "Bạn không cần trở lại như trước. Bạn có thể là một phiên bản mới, bình thản hơn và hiểu mình hơn." },
    { id: "healing-safe-place", categoryId: "healing", backgroundId: "healing", author: "Lặng", text: "Có lúc nơi trú ẩn dịu dàng nhất là cách ta thôi trách móc chính mình." },
    { id: "healing-past-person", categoryId: "healing", backgroundId: "healing", author: "Khuyết danh", text: "Đừng có tìm lại một người ở quá khứ. Vì ngay cả khi họ đứng trước mặt bạn, thì cũng không phải là người bạn yêu sâu đậm năm nào nữa." },

    // ===== Cổ phong =====
    { id: "ancient-dream", categoryId: "ancient", backgroundId: "ancient", author: "Khuyết danh", text: "Một thân, một ngựa, một giang hồ. Một giấc mộng tan, một kiếp người." },
    { id: "ancient-cloud", categoryId: "ancient", backgroundId: "ancient", author: "Lặng", text: "Mây qua đỉnh núi không lưu dấu. Người qua lòng nhau, sao dễ vô tình." },
    { id: "ancient-moon", categoryId: "ancient", backgroundId: "ancient", author: "Khuyết danh", text: "Trăng cũ còn soi bến vắng, chỉ người năm ấy chẳng quay về." },
    { id: "ancient-parting-rain", categoryId: "ancient", backgroundId: "ancient", author: "Khuyết danh", text: "Ai làm cho khói lên trời? Cho mưa xuống đất. Cho người biệt ly." },
    { id: "ancient-life-drama", categoryId: "ancient", backgroundId: "ancient", author: "Khuyết danh", text: "Nhân sinh như mộng, người tỉnh mộng tan. Hồng trần như kịch, người tản kịch tàn." },
    { id: "ancient-wandering-sword", categoryId: "ancient", backgroundId: "ancient", author: "Lặng", text: "Kiếm đã vào vỏ, ngựa đã qua đèo. Chỉ có lòng người còn phiêu bạt giữa một chiều sương." },
    { id: "ancient-river-moon", categoryId: "ancient", backgroundId: "ancient", author: "Lặng", text: "Trăng rơi đáy nước, người đứng bên sông. Một dòng lưu thủy, đôi bờ nhớ mong." },
    { id: "ancient-old-letter", categoryId: "ancient", backgroundId: "ancient", author: "Lặng", text: "Thư xưa mực nhạt, lời cũ chưa phai. Người đi vạn dặm, ta chờ một mai." },
    { id: "ancient-autumn-wind", categoryId: "ancient", backgroundId: "ancient", author: "Lặng", text: "Gió thu qua thành cũ, cuốn lá chẳng cuốn được tương tư." },
    { id: "ancient-distant-flute", categoryId: "ancient", backgroundId: "ancient", author: "Lặng", text: "Một tiếng tiêu xa, nửa đời ngoảnh lại. Cố nhân không thấy, chỉ thấy hoàng hôn." },
    { id: "ancient-dust-road", categoryId: "ancient", backgroundId: "ancient", author: "Lặng", text: "Hồng trần vạn nẻo, ta chọn một đường. Không cầu danh vọng, chỉ cầu bình tâm." },
    { id: "ancient-silent-pavilion", categoryId: "ancient", backgroundId: "ancient", author: "Lặng", text: "Đình vắng không người, trà nguội bên hiên. Chuyện năm tháng cũ, hỏi mây chẳng truyền." },
    { id: "ancient-spring-dream", categoryId: "ancient", backgroundId: "ancient", author: "Lặng", text: "Xuân đến hoa khai, xuân đi hoa tạ. Mộng gặp một người, tỉnh lại đã trăm năm." },
    { id: "ancient-one-thought", categoryId: "ancient", backgroundId: "ancient", author: "Khuyết danh", text: "Một niệm sinh ra khổ bụi trần. Ngàn năm vọng tưởng chốn phong vân. Tâm như trăng sáng không vương bụi. Ý tựa hư không chẳng dính trần." },
    { id: "ancient-pity-mistaken-love", categoryId: "ancient", backgroundId: "ancient", author: "Khuyết danh", text: "Nàng nhân từ cho ta chút thương hại. Trách nào ta lại tưởng đó là tình yêu." },
    { id: "ancient-unwritten-beloved", categoryId: "ancient", backgroundId: "ancient", author: "Khuyết danh", text: "Bút mực trên tay chưa hạ nét. Trong lòng đã vẽ dáng người thương." },

    // ===== Bình yên =====
    { id: "peace-presence", categoryId: "peace", backgroundId: "peace", author: "Lặng", text: "Bình yên không cần ồn ào để chứng minh rằng nó đang hiện diện." },
    { id: "peace-tea", categoryId: "peace", backgroundId: "peace", author: "Khuyết danh", text: "Một tách trà ấm, một căn phòng yên, thế là đủ cho một buổi chiều." },
    { id: "peace-window", categoryId: "peace", backgroundId: "peace", author: "Lặng", text: "Có những ngày hạnh phúc chỉ là mở cửa sổ và thấy lòng mình không vội." },
    { id: "peace-early-sun", categoryId: "peace", backgroundId: "peace", author: "Lặng", text: "Nắng sớm không vội vàng, vẫn kịp hong khô cả một khoảng sân." },
    { id: "peace-rain-roof", categoryId: "peace", backgroundId: "peace", author: "Lặng", text: "Ngồi nghe mưa trên mái nhà, ta mới biết có những âm thanh khiến lòng mình yên lặng." },
    { id: "peace-empty-calendar", categoryId: "peace", backgroundId: "peace", author: "Lặng", text: "Một khoảng trống trong lịch đôi khi chính là cuộc hẹn cần thiết nhất với bản thân." },
    { id: "peace-slow-breath", categoryId: "peace", backgroundId: "peace", author: "Lặng", text: "Bình yên bắt đầu từ một hơi thở không phải chạy theo bất kỳ điều gì." },
    { id: "peace-garden", categoryId: "peace", backgroundId: "peace", author: "Lặng", text: "Tâm trí cũng như khu vườn. Bớt một điều lo, thêm một khoảng trời." },
    { id: "peace-no-answer", categoryId: "peace", backgroundId: "peace", author: "Lặng", text: "Không phải câu hỏi nào cũng cần lời đáp. Có câu chỉ cần thời gian làm nó dịu đi." },
    { id: "peace-evening-lamp", categoryId: "peace", backgroundId: "peace", author: "Lặng", text: "Chiều xuống, thắp một ngọn đèn nhỏ và để mọi ồn ào dừng lại ngoài hiên." },
    { id: "peace-still-water", categoryId: "peace", backgroundId: "peace", author: "Lặng", text: "Khi mặt nước thôi xao động, bầu trời tự nhiên hiện rõ." },

    // ===== Gia đình =====
    { id: "family-light", categoryId: "family", backgroundId: "family", author: "Khuyết danh", text: "Nhà là nơi vẫn để lại một ngọn đèn, dù ta về muộn đến đâu." },
    { id: "family-table", categoryId: "family", backgroundId: "family", author: "Lặng", text: "Sau những chuyến đi dài, điều nhớ nhất đôi khi chỉ là một bữa cơm đủ người." },
    { id: "family-return", categoryId: "family", backgroundId: "family", author: "Khuyết danh", text: "Trưởng thành là đi thật xa rồi hiểu vì sao lòng mình luôn muốn trở về." },
    { id: "family-door", categoryId: "family", backgroundId: "family", author: "Lặng", text: "Cánh cửa nhà có thể cũ, nhưng luôn mở ra đúng nơi lòng mình muốn trở về." },
    { id: "family-call", categoryId: "family", backgroundId: "family", author: "Lặng", text: "Có những cuộc gọi chỉ hỏi đã ăn cơm chưa, mà đủ làm ấm cả một ngày dài." },
    { id: "family-kitchen", categoryId: "family", backgroundId: "family", author: "Lặng", text: "Mùi thức ăn từ căn bếp cũ là cách ký ức nhắc ta rằng mình từng được yêu thương." },
    { id: "family-old-hands", categoryId: "family", backgroundId: "family", author: "Lặng", text: "Bàn tay cha mẹ ngày một già đi, còn chúng ta thường chỉ nhận ra sau những lần nắm quá vội." },
    { id: "family-waiting", categoryId: "family", backgroundId: "family", author: "Lặng", text: "Ngoài kia người ta chờ ta thành công. Ở nhà, có người chỉ chờ ta bình an." },
    { id: "family-childhood", categoryId: "family", backgroundId: "family", author: "Lặng", text: "Tuổi thơ không biến mất. Nó nằm trong tiếng gọi quen mỗi khi ta bước qua cửa nhà." },
    { id: "family-shared-rice", categoryId: "family", backgroundId: "family", author: "Lặng", text: "Một mâm cơm giản dị sẽ thành kỷ niệm quý giá khi những chiếc ghế không còn luôn đủ người." },
    { id: "family-home-sound", categoryId: "family", backgroundId: "family", author: "Lặng", text: "Âm thanh dễ chịu nhất sau một ngày mệt mỏi là tiếng người thân đang nói chuyện trong nhà." },

    // ===== Công việc =====
    { id: "work-depth", categoryId: "work", backgroundId: "work", author: "Lặng", text: "Đừng vội làm nhiều. Hãy làm một điều đủ sâu để chính mình thấy tự hào." },
    { id: "work-seed", categoryId: "work", backgroundId: "work", author: "Khuyết danh", text: "Việc nhỏ làm đều mỗi ngày rồi cũng thành một khu vườn." },
    { id: "work-pause", categoryId: "work", backgroundId: "work", author: "Lặng", text: "Khoảng nghỉ không làm mất nhịp. Nó giữ ta đủ sức để đi đường dài." },
    { id: "work-focus", categoryId: "work", backgroundId: "work", author: "Lặng", text: "Tập trung không phải làm nhiều thứ hơn, mà là biết điều gì xứng đáng được làm trước." },
    { id: "work-craft", categoryId: "work", backgroundId: "work", author: "Lặng", text: "Làm nghề lâu năm chưa chắc tạo nên tay nghề. Sự để tâm trong từng lần làm mới có thể." },
    { id: "work-mistake", categoryId: "work", backgroundId: "work", author: "Lặng", text: "Một sai sót được nhìn thẳng có giá trị hơn mười lần đúng nhờ may mắn." },
    { id: "work-patience", categoryId: "work", backgroundId: "work", author: "Lặng", text: "Có những kết quả chỉ đến khi sự kiên nhẫn đã trở thành một phần của công việc." },
    { id: "work-finish", categoryId: "work", backgroundId: "work", author: "Lặng", text: "Hoàn thành một việc vừa đủ tốt thường có ích hơn giữ mãi một ý tưởng hoàn hảo." },
    { id: "work-courage-no", categoryId: "work", backgroundId: "work", author: "Lặng", text: "Biết nói không với việc không cần thiết là cách giữ lời với điều quan trọng." },
    { id: "work-quiet-progress", categoryId: "work", backgroundId: "work", author: "Lặng", text: "Tiến bộ thật sự thường rất yên lặng: thêm một chút hiểu biết, bớt một lần bỏ cuộc." },
    { id: "work-rested-mind", categoryId: "work", backgroundId: "work", author: "Lặng", text: "Một tâm trí được nghỉ ngơi không làm việc ít đi; nó làm việc sáng rõ hơn." },

    // ===== Động lực =====
    { id: "motivation-step", categoryId: "motivation", backgroundId: "motivation", author: "Khuyết danh", text: "Không cần thấy hết con đường. Chỉ cần đủ can đảm cho bước chân kế tiếp." },
    { id: "motivation-mountain", categoryId: "motivation", backgroundId: "motivation", author: "Lặng", text: "Núi cao không thấp xuống, nhưng người đi mãi rồi cũng đến." },
    { id: "motivation-begin", categoryId: "motivation", backgroundId: "motivation", author: "Khuyết danh", text: "Ngày thích hợp nhất để bắt đầu là ngày ta thôi chờ mình hết sợ." },
    { id: "motivation-one-more", categoryId: "motivation", backgroundId: "motivation", author: "Lặng", text: "Khi muốn dừng lại, hãy thử thêm một bước nhỏ. Đôi khi bước ấy đưa ta qua đoạn khó nhất." },
    { id: "motivation-after-fall", categoryId: "motivation", backgroundId: "motivation", author: "Lặng", text: "Ngã xuống không xóa đi quãng đường đã đi. Đứng dậy là cách ta viết tiếp nó." },
    { id: "motivation-small-fire", categoryId: "motivation", backgroundId: "motivation", author: "Lặng", text: "Không cần một ngọn lửa lớn để bắt đầu. Một đốm sáng được giữ gìn cũng đủ dẫn đường." },
    { id: "motivation-own-race", categoryId: "motivation", backgroundId: "motivation", author: "Lặng", text: "Đừng dùng vạch đích của người khác để đo hành trình của mình." },
    { id: "motivation-hard-day", categoryId: "motivation", backgroundId: "motivation", author: "Lặng", text: "Một ngày làm chưa tốt không có nghĩa là bạn không đủ tốt. Ngày mai vẫn còn chỗ để thử lại." },
    { id: "motivation-door", categoryId: "motivation", backgroundId: "motivation", author: "Lặng", text: "Cơ hội hiếm khi gõ cửa thật lớn. Đôi khi nó chỉ là một ý nghĩ nhỏ bảo ta hãy thử." },
    { id: "motivation-try-again", categoryId: "motivation", backgroundId: "motivation", author: "Lặng", text: "Bắt đầu lại không đưa ta về số không. Ta trở lại cùng tất cả điều đã học được." },
    { id: "motivation-horizon", categoryId: "motivation", backgroundId: "motivation", author: "Lặng", text: "Chân trời lùi xa khi ta bước tới, nhưng mỗi bước đều mở rộng thế giới của mình." },

    // ===== Cô đơn =====
    { id: "lonely-room", categoryId: "lonely", backgroundId: "lonely", author: "Lặng", text: "Cô đơn không phải căn phòng trống. Đó là khi chẳng biết gọi ai giữa căn phòng đầy người." },
    { id: "lonely-moon", categoryId: "lonely", backgroundId: "lonely", author: "Khuyết danh", text: "Trăng vẫn tròn trên mặt hồ vắng. Có những vẻ đẹp chỉ hiện ra khi không ai bên cạnh." },
    { id: "lonely-listen", categoryId: "lonely", backgroundId: "lonely", author: "Lặng", text: "Ở một mình đủ lâu, ta sẽ nghe được điều trái tim đã nói rất khẽ." },
    { id: "lonely-own-company", categoryId: "lonely", backgroundId: "lonely", author: "Lặng", text: "Khi học được cách làm bạn với chính mình, cô đơn không còn là một căn phòng khóa cửa." },
    { id: "lonely-night-light", categoryId: "lonely", backgroundId: "lonely", author: "Lặng", text: "Đêm dài đến đâu cũng có một ngọn đèn nhỏ dành cho người chưa ngủ." },
    { id: "lonely-empty-seat", categoryId: "lonely", backgroundId: "lonely", author: "Lặng", text: "Chiếc ghế trống không nói gì, nhưng có thể nhắc ta về một người lâu hơn mọi lời từ biệt." },
    { id: "lonely-silence", categoryId: "lonely", backgroundId: "lonely", author: "Lặng", text: "Im lặng đôi khi không phải hết chuyện để nói, mà là chưa tìm được người có thể nghe." },
    { id: "lonely-stars", categoryId: "lonely", backgroundId: "lonely", author: "Lặng", text: "Những vì sao đứng rất xa nhau mà vẫn cùng làm nên một bầu trời." },
    { id: "lonely-walk-home", categoryId: "lonely", backgroundId: "lonely", author: "Lặng", text: "Có những tối đi một mình, tiếng bước chân cũng đủ nhắc rằng ta vẫn đang tiến về nhà." },
    { id: "lonely-name-feeling", categoryId: "lonely", backgroundId: "lonely", author: "Lặng", text: "Gọi đúng tên nỗi cô đơn là bước đầu tiên để nó không còn điều khiển mình." },
    { id: "lonely-dawn", categoryId: "lonely", backgroundId: "lonely", author: "Lặng", text: "Bình minh không hỏi đêm qua có ai bên cạnh. Nó vẫn đến và đặt ánh sáng lên mọi khung cửa." },
    { id: "lonely-tired-wings", categoryId: "lonely", backgroundId: "lonely", author: "Khuyết danh", text: "Ta khác gì những cánh chim mệt mỏi, chẳng hiểu mình đang cất cánh hay rơi." },
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
