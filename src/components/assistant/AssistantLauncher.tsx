import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HiOutlineChatAlt2 } from 'react-icons/hi'
import { useAuthStore } from '../../store/authStore'
import { useLocaleStore } from '../../store/localeStore'
import { assistantT } from '../../i18n/assistant'
import { useAssistantName } from '../../hooks/useAssistantName'
import { canUseAssistant, useAssistantStatus } from '../../hooks/useAssistant'
import AssistantPanel from './AssistantPanel'

// The header button and the chat panel behind it. The panel stays mounted while closed, so the
// conversation survives moving between screens.
export default function AssistantLauncher() {
  const role = useAuthStore((state) => state.user?.role)
  const locale = useLocaleStore((state) => state.locale)
  const allowed = canUseAssistant(role)
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const status = useAssistantStatus(open && allowed)
  const local = useAssistantName()
  // the server's answer wins: it knows the business even for an employee
  const persona = status.data?.assistant
    ? { name: status.data.assistant.name, gender: status.data.assistant.gender }
    : { name: local.name, gender: local.gender }

  if (!allowed) return null

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={assistantT(locale, 'open', { name: persona.name })}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full px-2 py-2 text-purple-700 transition-colors hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-purple-300 dark:hover:bg-purple-900/30 sm:px-3"
      >
        <HiOutlineChatAlt2 className="h-6 w-6" aria-hidden="true" />
        <span className="hidden text-sm font-medium md:inline">{persona.name}</span>
      </button>
      {/* straight into <body>: the header's spacing and stacking shouldn't reach a full-screen panel */}
      {createPortal(<AssistantPanel open={open} onClose={close} status={status} persona={persona} />, document.body)}
    </>
  )
}
