import type { ReactNode } from 'react'

import PublicShell from '../public/PublicShell'

// The old token portal keeps its own name but wears the same guest frame as booking.
export default function ClientShell({
  title,
  actions,
  children,
}: {
  title: string
  actions?: ReactNode
  children: ReactNode
}) {
  return <PublicShell title={title} actions={actions}>{children}</PublicShell>
}
