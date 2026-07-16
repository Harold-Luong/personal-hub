import { CheckCircle2, FileDiff } from "lucide-react";
import MarkedCharacters from "./MarkedCharacters";

const MAX_VISIBLE_CHANGES = 200;

const CHANGE_LABELS = {
    added: "Thêm",
    removed: "Xóa",
    changed: "Thay đổi",
};

function ChangeLocation({ change }) {
    if (change.type === "added") return <>Văn bản B · Dòng {change.afterLine}</>;
    if (change.type === "removed") return <>Văn bản A · Dòng {change.beforeLine}</>;
    return <>Dòng A:{change.beforeLine} → B:{change.afterLine}</>;
}

export default function TextDiffPanel({ result }) {
    if (!result) return null;

    if (result.isEqual) {
        return (
            <section className="text-diff-card is-equal" aria-live="polite">
                <CheckCircle2 aria-hidden="true" size={20} />
                <div>
                    <strong>Hai văn bản giống nhau</strong>
                    <p>Không tìm thấy dòng nào khác biệt.</p>
                </div>
            </section>
        );
    }

    const visibleChanges = result.changes.slice(0, MAX_VISIBLE_CHANGES);

    return (
        <section className="text-diff-card" aria-live="polite">
            <header className="text-diff-card__header">
                <div>
                    <span className="text-diff-card__eyebrow"><FileDiff aria-hidden="true" size={16} /> Kết quả so sánh văn bản</span>
                    <strong>{result.changes.length.toLocaleString("vi-VN")} dòng khác biệt</strong>
                </div>
                <div className="text-diff-card__summary" aria-label="Tóm tắt thay đổi">
                    <span className="is-added">+{result.summary.added} thêm</span>
                    <span className="is-removed">−{result.summary.removed} xóa</span>
                    <span className="is-changed">~{result.summary.changed} thay đổi</span>
                </div>
            </header>

            <ol className="text-diff-card__changes">
                {visibleChanges.map((change, index) => (
                    <li className={`is-${change.type}`} key={`${change.type}-${change.beforeLine ?? ""}-${change.afterLine ?? ""}-${index}`}>
                        <div className="text-diff-card__change-heading">
                            <span>{CHANGE_LABELS[change.type]}</span>
                            <small><ChangeLocation change={change} /></small>
                        </div>
                        {change.beforeText !== undefined ? (
                            <pre className="is-before">− <MarkedCharacters ranges={result.beforeCharacterHighlights[change.beforeLine]} text={change.beforeText || " "} /></pre>
                        ) : null}
                        {change.afterText !== undefined ? (
                            <pre className="is-after">+ <MarkedCharacters ranges={result.afterCharacterHighlights[change.afterLine]} text={change.afterText || " "} /></pre>
                        ) : null}
                    </li>
                ))}
            </ol>

            {result.changes.length > MAX_VISIBLE_CHANGES ? (
                <p className="text-diff-card__limit-note">
                    Đang hiển thị {MAX_VISIBLE_CHANGES.toLocaleString("vi-VN")} thay đổi đầu tiên để giữ giao diện ổn định.
                </p>
            ) : null}
        </section>
    );
}
