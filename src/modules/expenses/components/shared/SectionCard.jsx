export default function SectionCard({ actionLabel, children, className = '', title }) {
  return (
    <section className={`section-card ${className}`.trim()}>
      {(title || actionLabel) ? (
        <header className="section-card__header">
          {title ? <h2>{title}</h2> : <span />}
          {actionLabel ? <button type="button">{actionLabel}</button> : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}
