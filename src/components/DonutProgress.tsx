interface DonutProgressProps {
  value: number
  caption?: string
  size?: number
  stroke?: number
  color?: string
}

export default function DonutProgress({ value, caption, size = 140, stroke = 7, color = '#e04aa8' }: DonutProgressProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e6e6ea" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[30px] font-semibold leading-none" style={{ color }}>{pct}%</span>
        {caption && <span className="mt-2 px-4 text-[9px] font-semibold text-[#9b9ba3]">{caption}</span>}
      </div>
    </div>
  )
}
