import SummaryCard from './SummaryCard'

export default function SummaryCardList({ items = [], variant = 'grid' }) {
  return (
    <div className={`summary-card-list summary-card-list--${variant}`}>
      {items.map((item) => (
        <SummaryCard key={item.id ?? item.label} {...item} />
      ))}
    </div>
  )
}
