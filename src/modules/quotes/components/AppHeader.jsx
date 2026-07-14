import { useState } from "react";
import { ArrowLeft, Heart, Menu, X } from "lucide-react";
import { NavLink } from "react-router";
import { quoteRoutes } from "../constants/quoteMetadata";
import ThemeToggle from "./ThemeToggle";

const navigationItems = [
    { label: "Trang chủ", path: quoteRoutes.home },
    { label: "Chủ đề", path: quoteRoutes.explore },
    { label: "Yêu thích", path: quoteRoutes.favorites },
    { label: "Tạo ảnh", path: quoteRoutes.create },
];

export default function AppHeader({ favoriteCount = 0, onToggleTheme, theme, transparent = false }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const headerClassName = `lang-header${transparent ? " lang-header--transparent" : ""}`;

    return (
        <header className={headerClassName}>
            <div className="lang-header__brand">
                <NavLink
                    aria-label="Quay lại Personal Hub"
                    className="lang-header__hub-back"
                    onClick={() => setIsMenuOpen(false)}
                    title="Quay lại Personal Hub"
                    to="/hub"
                >
                    <ArrowLeft aria-hidden="true" size={18} />
                </NavLink>
                <NavLink className="lang-logo" onClick={() => setIsMenuOpen(false)} to={quoteRoutes.home}>
                    Lặng<span aria-hidden="true">.</span>
                </NavLink>
            </div>

            <nav className={`lang-navigation${isMenuOpen ? " is-open" : ""}`} aria-label="Điều hướng Lặng">
                {navigationItems.map((item) => (
                    <NavLink
                        className={({ isActive }) => isActive ? "is-active" : undefined}
                        end={item.path === quoteRoutes.home}
                        key={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        to={item.path}
                    >
                        {item.label}
                    </NavLink>
                ))}
                <span className="lang-navigation__theme">
                    <ThemeToggle onToggle={onToggleTheme} theme={theme} />
                </span>
            </nav>

            <div className="lang-header__actions">
                <ThemeToggle onToggle={onToggleTheme} theme={theme} />
                <NavLink aria-label={`Yêu thích, ${favoriteCount} câu`} className="lang-header__favorite" to={quoteRoutes.favorites}>
                    <Heart aria-hidden="true" size={19} />
                    {favoriteCount > 0 ? <span>{favoriteCount}</span> : null}
                </NavLink>
                <button
                    aria-expanded={isMenuOpen}
                    aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
                    className="lang-header__menu"
                    onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
                    type="button"
                >
                    {isMenuOpen ? <X aria-hidden="true" size={21} /> : <Menu aria-hidden="true" size={21} />}
                </button>
            </div>
        </header>
    );
}
