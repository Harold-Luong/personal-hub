import { ArrowUpRight } from "lucide-react";

export default function CategoryCard({ category, onClick }) {
    return (
        <button className="category-card" onClick={() => onClick(category.id)} type="button">
            <img alt="" loading="lazy" src={category.background} />
            <span className="category-card__overlay" />
            <span className="category-card__content">
                <small>{category.count} câu nói</small>
                <strong>{category.name}</strong>
                <span>{category.description}</span>
            </span>
            <ArrowUpRight aria-hidden="true" className="category-card__arrow" size={20} />
        </button>
    );
}
