export default function SectionCard({
    actionLabel = "Xem tất cả",
    children,
    className = "",
    onAction,
    title,
}) {
    return (
        <section className={`section-card ${className}`.trim()}>
            {title || actionLabel ? (
                <header className="section-card__header">
                    {title ? <h2>{title}</h2> : <span />}
                    {actionLabel ? (
                        <button onClick={onAction} type="button">
                            {actionLabel}
                        </button>
                    ) : null}
                </header>
            ) : null}
            {children}
        </section>
    );
}
