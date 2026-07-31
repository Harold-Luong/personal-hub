import { ArrowLeft, ExternalLink } from "lucide-react";
import { NavLink } from "react-router";
import "../styles/cv-studio.scss";

const CV_STUDIO_URL = "https://cv-studio-6a539.web.app/";

export default function CVStudioPage() {
    return (
        <main className="cv-studio-page">
            <header className="cv-studio-page__header">
                <NavLink aria-label="Quay lại Personal Hub" className="cv-studio-page__back" to="/hub">
                    <ArrowLeft aria-hidden="true" size={18} />
                    <span>Hub</span>
                </NavLink>

                <div className="cv-studio-page__title">
                    <strong>CV Studio</strong>
                    <small>Thiết kế CV chuyên nghiệp</small>
                </div>

                <a
                    aria-label="Mở CV Studio trong tab mới"
                    className="cv-studio-page__external"
                    href={CV_STUDIO_URL}
                    rel="noreferrer"
                    target="_blank"
                >
                    <span>Mở tab mới</span>
                    <ExternalLink aria-hidden="true" size={17} />
                </a>
            </header>

            <section className="cv-studio-page__viewport" aria-label="Ứng dụng CV Studio">
                <iframe
                    allow="clipboard-write"
                    className="cv-studio-page__frame"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={CV_STUDIO_URL}
                    title="CV Studio"
                />
            </section>
        </main>
    );
}
