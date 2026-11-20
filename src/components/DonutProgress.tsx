interface DonutProgressProps {
  value: number
  caption?: string
  size?: number
  stroke?: number
  color?: string
}

export default function DonutProgress({ value, caption, size = 148, stroke = 10, color = 'url(#x-donut-gradient)' }: DonutProgressProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="x-donut-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--chart-2)" />
            <stop offset="1" stopColor="var(--chart-1)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--workspace-fill)" strokeWidth={stroke} />
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
        <span className="font-display text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-[var(--workspace-ink)]">{pct}<span className="text-[18px] text-[var(--workspace-muted)]">%</span></span>
        {caption && <span className="mt-1.5 px-4 text-[11px] font-medium tabular-nums text-[var(--workspace-subtle)]">{caption}</span>}
      </div>
    </div>
  )
}
