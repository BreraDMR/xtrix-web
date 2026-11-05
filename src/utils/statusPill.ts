// Xtrix status pills: planned purple, in progress amber, completed green, cancelled pink
export function visitStatusClass(status: string | null | undefined): string {
  switch (status) {
    case 'planned': return 'border border-[#d9c5f8] bg-[#e9dcfb] font-bold text-[#7c3aed] dark:border-primary-800 dark:bg-primary-900/40 dark:text-primary-200'
    case 'in_progress': return 'border border-[#fbd9b5] bg-[#fdecd9] font-bold text-[#b45309] dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'
    case 'completed': return 'border border-[#1f7a3a] bg-[#d9efe1] font-bold text-[#1f7a3a] dark:bg-green-950 dark:text-green-200'
    default: return 'border border-[#f3c6d4] bg-[#f8dde6] font-bold text-[#c81e3a] dark:border-pink-900 dark:bg-pink-950 dark:text-pink-200'
  }
}
