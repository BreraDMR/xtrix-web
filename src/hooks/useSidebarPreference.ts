import { useEffect, useState } from 'react'

const STORAGE_KEY = 'xtrix.sidebar.compact'

export function useSidebarPreference() {
  const [isCompact, setIsCompact] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isCompact))
    } catch {
      // The menu still works if browser storage is blocked or full.
    }
  }, [isCompact])

  return [isCompact, setIsCompact] as const
}
