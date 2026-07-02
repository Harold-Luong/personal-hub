export default function SectionCard({ actionLabel = "Xem tất cả", children, className = "", monthLabel, onAction, title }) {
    return (
        <section className={`section-card ${className}`.trim()}>
            {title || actionLabel ? (
                <header className="section-card__header">
                    {title ? (
                        <div className="section-card__title">
                            <h2>{title}</h2>
                            {monthLabel ? <span>({monthLabel})</span> : null}
                        </div>
                    ) : (
                        <span />
                    )}

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
