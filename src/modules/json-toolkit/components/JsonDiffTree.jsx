import { CheckCircle2, ChevronRight, CircleMinus, CirclePlus, RefreshCw } from "lucide-react";
import { countDiffLeaves } from "../utils/diff";

function formatValue(value) {
    if (value === undefined) return "undefined";
    const serialized = JSON.stringify(value);
    return serialized === undefined ? String(value) : serialized;
}

function DiffLeaf({ node }) {
    const icons = {
        added: <CirclePlus aria-hidden="true" size={16} />,
        changed: <RefreshCw aria-hidden="true" size={16} />,
        equal: <CheckCircle2 aria-hidden="true" size={16} />,
        removed: <CircleMinus aria-hidden="true" size={16} />,
    };

    return (
        <li className={`json-diff-leaf is-${node.type}`}>
            <span className="json-diff-leaf__icon">{icons[node.type]}</span>
            <div>
                <code>{node.path || "$"}</code>
                {node.type === "changed" ? (
                    <span>
                        <s>{formatValue(node.before)}</s>
                        <ChevronRight aria-hidden="true" size={14} />
                        <b>{formatValue(node.after)}</b>
                        <em>đã thay đổi</em>
                    </span>
                ) : null}
                {node.type === "added" ? <span><b>{formatValue(node.after)}</b><em>đã thêm</em></span> : null}
                {node.type === "removed" ? <span><s>{formatValue(node.before)}</s><em>đã xóa</em></span> : null}
            </div>
        </li>
    );
}

function renderNodes(nodes) {
    return nodes.map((node) => {
        if (node.children?.length) {
            return (
                <li className="json-diff-branch" key={`${node.path}-${node.type}`}>
                    <span>{node.path || "Gốc"}</span>
                    <ul>{renderNodes(node.children)}</ul>
                </li>
            );
        }

        return <DiffLeaf key={`${node.path}-${node.type}`} node={node} />;
    });
}

export default function JsonDiffTree({ diff }) {
    if (!diff) return null;

    const differenceCount = countDiffLeaves(diff);

    return (
        <section className="json-diff-card" aria-live="polite">
            <div className="json-diff-card__heading">
                <div>
                    <span>So sánh đệ quy</span>
                    <h2>Kết quả Diff</h2>
                </div>
                <strong className={differenceCount ? "has-differences" : "is-equal"}>
                    {differenceCount ? `${differenceCount} điểm khác biệt` : "Hai tài liệu giống nhau"}
                </strong>
            </div>
            {differenceCount ? (
                <div aria-label="Chú thích màu Diff" className="json-diff-legend">
                    <span className="is-added">Đã thêm</span>
                    <span className="is-removed">Đã xóa</span>
                    <span className="is-changed">Đã thay đổi</span>
                </div>
            ) : null}
            {differenceCount ? <ul className="json-diff-tree">{renderNodes(diff.children ?? [diff])}</ul> : (
                <div className="json-diff-empty"><CheckCircle2 aria-hidden="true" size={22} /> Không tìm thấy khác biệt về cấu trúc.</div>
            )}
        </section>
    );
}
