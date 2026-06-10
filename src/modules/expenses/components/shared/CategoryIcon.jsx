const iconMap = {
  bank: 'BN',
  bag: 'SH',
  bus: 'MV',
  card: 'CR',
  chart: 'BR',
  education: 'ED',
  eye: 'EY',
  family: 'FM',
  finance: 'FN',
  game: 'GM',
  health: 'HL',
  home: 'HM',
  income: 'IN',
  momo: 'MO',
  more: 'OT',
  saving: 'SV',
  settings: 'ST',
  swap: 'TR',
  utensils: 'FD',
  wallet: 'WL',
  work: 'WK',
  travel: 'TV',
}

const emojiMap = {
  bank: '🏦',
  bag: '🛍️',
  bus: '🚌',
  card: '💳',
  chart: '📊',
  coffee: '☕',
  education: '🎓',
  eye: '👁️',
  family: '👪',
  finance: '💹',
  food: '🍽️',
  fuel: '⛽',
  fun: '🎮',
  game: '🎮',
  health: '🩺',
  home: '🏠',
  income: '💰',
  meal: '🍲',
  momo: '📱',
  more: '🧾',
  movie: '🎬',
  saving: '🪙',
  settings: '⚙️',
  shopping: '🛒',
  swap: '🔁',
  transfer: '↔️',
  transport: '🚌',
  travel: '✈️',
  utensils: '🍽️',
  wallet: '👛',
  work: '💼',
}

export default function CategoryIcon({
  appearance = 'label',
  className = '',
  icon = 'more',
  label,
  color,
}) {
  const icons = appearance === 'emoji' ? emojiMap : iconMap

  return (
    <span
      className={`category-icon category-icon--${appearance} ${className}`.trim()}
      aria-label={label}
      role="img"
      style={color ? { '--icon-color': color } : undefined}
    >
      {icons[icon] ?? icons.more}
    </span>
  )
}
