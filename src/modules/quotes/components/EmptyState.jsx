import { Heart } from "lucide-react";
import { Link } from "react-router";
import { quoteRoutes } from "../constants/quoteMetadata";

export default function EmptyState() {
    return (
        <section className="lang-empty-state">
            <span><Heart aria-hidden="true" size={24} /></span>
            <h2>Bạn chưa lưu câu nói nào.</h2>
            <p>Khi một câu chữ chạm đến bạn, hãy nhấn Lưu để giữ nó lại ở đây.</p>
            <Link to={quoteRoutes.home}>Tìm một câu nói</Link>
        </section>
    );
}
