import { useState, type FormEvent, type MouseEvent } from 'react'
import { HiOutlineArchive, HiOutlineCheck, HiOutlinePencil, HiOutlinePlus, HiOutlineX } from 'react-icons/hi'
import type { ConversationOut } from '../../api/types'
import { useLocaleStore } from '../../store/localeStore'
import { assistantT } from '../../i18n/assistant'

interface ConversationListProps {
  conversations: ConversationOut[]
  activeId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
  onRename: (id: string, newTitle: string) => Promise<unknown>
  onArchive: (id: string) => Promise<unknown>
  isCreating?: boolean
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onRename,
  onArchive,
  isCreating = false,
}: ConversationListProps) {
  const locale = useLocaleStore((state) => state.locale)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null)

  const handleStartRename = (e: MouseEvent, conv: ConversationOut) => {
    e.stopPropagation()
    setEditingId(conv.id)
    setEditingTitle(conv.title)
    setConfirmArchiveId(null)
  }

  const handleCancelRename = (e: MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
    setEditingTitle('')
  }

  const handleSaveRename = async (e: FormEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const trimmed = editingTitle.trim()
    if (!trimmed) return
    try {
      await onRename(id, trimmed)
      setEditingId(null)
      setEditingTitle('')
    } catch {
      // Keep edit state on error so user doesn't lose their input
    }
  }

  const handleStartArchive = (e: MouseEvent, id: string) => {
    e.stopPropagation()
    setConfirmArchiveId(id)
    setEditingId(null)
  }

  const handleCancelArchive = (e: MouseEvent) => {
    e.stopPropagation()
    setConfirmArchiveId(null)
  }

  const handleConfirmArchive = async (e: MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await onArchive(id)
      setConfirmArchiveId(null)
    } catch {
      // Error handling
    }
  }

  return (
    <div className="flex flex-col border-b border-gray-200 bg-gray-50/60 p-2.5 dark:border-gray-700/80 dark:bg-gray-800/40">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
          {assistantT(locale, 'conversations')}
        </span>
        <button
          type="button"
          onClick={onNewChat}
          disabled={isCreating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <HiOutlinePlus className="h-3.5 w-3.5" />
          <span>{assistantT(locale, 'newConversation')}</span>
        </button>
      </div>

      {conversations.length === 0 ? (
        <p className="py-2 text-center text-xs text-gray-400 dark:text-gray-500">
          {assistantT(locale, 'noConversations')}
        </p>
      ) : (
        <div className="flex max-h-36 flex-col gap-1 overflow-y-auto overscroll-contain pr-1">
          {conversations.map((conv) => {
            const isSelected = conv.id === activeId
            const isEditing = conv.id === editingId
            const isArchiving = conv.id === confirmArchiveId

            if (isEditing) {
              return (
                <form
                  key={conv.id}
                  onSubmit={(e) => handleSaveRename(e, conv.id)}
                  className="flex items-center gap-1.5 rounded-md bg-white p-1 shadow-xs dark:bg-gray-700"
                >
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    autoFocus
                    maxLength={160}
                    className="min-w-0 flex-1 rounded px-1.5 py-0.5 text-xs text-gray-900 border border-blue-400 focus:outline-hidden dark:text-white"
                  />
                  <button
                    type="submit"
                    className="p-1 text-green-600 hover:text-green-700"
                    aria-label={assistantT(locale, 'confirm')}
                  >
                    <HiOutlineCheck className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelRename}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    aria-label={assistantT(locale, 'cancel')}
                  >
                    <HiOutlineX className="h-3.5 w-3.5" />
                  </button>
                </form>
              )
            }

            if (isArchiving) {
              return (
                <div
                  key={conv.id}
                  className="flex items-center justify-between gap-1.5 rounded-md bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300"
                >
                  <span className="truncate">{assistantT(locale, 'confirmArchive')}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleConfirmArchive(e, conv.id)}
                      className="rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-medium text-white hover:bg-red-700"
                    >
                      {assistantT(locale, 'confirm')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelArchive}
                      className="rounded bg-gray-200 px-1.5 py-0.5 text-[11px] text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200"
                    >
                      {assistantT(locale, 'cancel')}
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`group flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                  isSelected
                    ? 'bg-blue-100/70 font-semibold text-blue-900 dark:bg-blue-900/40 dark:text-blue-200'
                    : 'text-gray-700 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className="truncate">{conv.title}</span>
                <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => handleStartRename(e, conv)}
                    className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label={assistantT(locale, 'renameConversation')}
                    title={assistantT(locale, 'renameConversation')}
                  >
                    <HiOutlinePencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleStartArchive(e, conv.id)}
                    className="p-0.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    aria-label={assistantT(locale, 'archiveConversation')}
                    title={assistantT(locale, 'archiveConversation')}
                  >
                    <HiOutlineArchive className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
