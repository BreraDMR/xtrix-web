import { useEffect, useState } from 'react'

// Whole seconds left until `until` (ms since epoch); 0 once it's passed or when there's nothing to wait for.
export function useCountdown(until: number | null): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    if (!until) return
    const timer = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= until) clearInterval(timer)
    }, 250)
    return () => clearInterval(timer)
  }, [until])
  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0
}

// 75 -> "1:15"
export function minutesSeconds(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
