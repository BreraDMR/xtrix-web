// visit status pills: soft tints - planned purple, in progress amber, completed green, cancelled red
export function visitStatusClass(status: string | null | undefined): string {
  switch (status) {
    case 'planned': return 'bg-[#f4edfd] font-medium text-[#7633c2] dark:bg-primary-900/40 dark:text-primary-200'
    case 'in_progress': return 'bg-[#fdf1df] font-medium text-[#a35a00] dark:bg-amber-950 dark:text-amber-200'
    case 'completed': return 'bg-[#e3f5e8] font-medium text-[#1a7f37] dark:bg-green-950 dark:text-green-300'
    default: return 'bg-[#fdebee] font-medium text-[#c4122f] dark:bg-red-950 dark:text-red-300'
  }
}
