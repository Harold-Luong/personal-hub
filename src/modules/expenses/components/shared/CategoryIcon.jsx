const iconMap = {
  bank: 'BN',
  bag: 'SH',
  bus: 'MV',
  card: 'CR',
  chart: 'BR',
  eye: 'EY',
  game: 'GM',
  home: 'HM',
  income: 'IN',
  momo: 'MO',
  more: 'OT',
  saving: 'SV',
  settings: 'ST',
  swap: 'TR',
  utensils: 'FD',
  wallet: 'WL',
}

export default function CategoryIcon({ icon = 'more', label, color }) {
  return (
    <span className="category-icon" aria-label={label} style={color ? { '--icon-color': color } : undefined}>
      {iconMap[icon] ?? iconMap.more}
    </span>
  )
}
