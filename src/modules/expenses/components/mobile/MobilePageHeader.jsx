export default function MobilePageHeader({
    actions,
    children,
    className = "",
    subtitle,
    title,
    titleTag: TitleTag = "p",
}) {
    const headerClassName = ["mobile-dashboard-surface__header", className].filter(Boolean).join(" ");

    return (
        <header className={headerClassName}>
            <div className="mobile-dashboard-surface__header-copy">
                {children ?? (
                    <>
                        {title ? <TitleTag>{title}</TitleTag> : null}
                        {subtitle ? <span>{subtitle}</span> : null}
                    </>
                )}
            </div>
            {actions ? <div className="mobile-dashboard-surface__header-actions">{actions}</div> : null}
        </header>
    );
}
