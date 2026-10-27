import { ArrowLeft, ExternalLink } from "lucide-react";
import { NavLink } from "react-router";
import "../styles/am-lich.scss";

const AM_LICH_URL = "https://am-lich.lich-viet.workers.dev/";

export default function AmLichPage() {
    return (
        <main className="am-lich-page">
            <header className="am-lich-page__header">
                <NavLink aria-label="Quay lại Personal Hub" className="am-lich-page__back" to="/hub">
                    <ArrowLeft aria-hidden="true" size={18} />
                    <span>Hub</span>
                </NavLink>

                <div className="am-lich-page__title">
                    <strong>Âm lịch</strong>
                    <small>Lịch âm Việt Nam</small>
                </div>

                <a
                    aria-label="Mở Âm lịch trong tab mới"
                    className="am-lich-page__external"
                    href={AM_LICH_URL}
                    rel="noreferrer"
                    target="_blank"
                >
                    <span>Mở tab mới</span>
                    <ExternalLink aria-hidden="true" size={17} />
                </a>
            </header>

            <section className="am-lich-page__viewport" aria-label="Ứng dụng Âm lịch">
                <iframe
                    className="am-lich-page__frame"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={AM_LICH_URL}
                    title="Âm lịch Việt Nam"
                />
            </section>
        </main>
    );
}
