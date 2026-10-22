import { useEffect, useRef } from 'react'

type DialogEntry = {
  element: HTMLDialogElement
  trigger: HTMLElement | null
  fallback: () => HTMLElement | null
  parent?: DialogEntry
}

const dialogs: DialogEntry[] = []
let previousOverflow = ''

function restoreFocus(entry: DialogEntry) {
  const top = dialogs[dialogs.length - 1]?.element
  for (let current: DialogEntry | undefined = entry; current; current = current.parent) {
    for (const target of [current.trigger, current.fallback()]) {
      if (target?.isConnected && !target.closest('dialog:not([open])') && (!top || top.contains(target))) {
        target.focus()
        return
      }
    }
  }
}

export function useNativeDialog(fallbackFocusId?: string) {
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null)
  const fallback = useRef(fallbackFocusId)
  fallback.current = fallbackFocusId

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    const entry: DialogEntry = {
      element,
      trigger: opener.current,
      fallback: () => fallback.current ? document.getElementById(fallback.current) : null,
      parent: [...dialogs].reverse().find(item => item.element.contains(element)
        || (!!opener.current && item.element.contains(opener.current))),
    }
    const descendants = dialogs.filter(item => element.contains(item.element))
    const firstChild = descendants.length ? dialogs.indexOf(descendants[0]) : dialogs.length
    if (dialogs.length === 0) previousOverflow = document.body.style.overflow
    dialogs.splice(firstChild, 0, entry)
    document.body.style.overflow = 'hidden'

    // Effects mount inside out. Open ancestors first when a whole stack mounts together.
    for (const child of [...descendants].reverse()) {
      if (child.element.open) child.element.close()
      if (!child.parent || !element.contains(child.parent.element)) child.parent = entry
    }
    element.showModal()
    for (const child of descendants) child.element.showModal()

    return () => {
      const index = dialogs.indexOf(entry)
      if (index < 0) return
      const wasTop = index === dialogs.length - 1
      dialogs.splice(index, 1)
      if (element.open) element.close()
      if (dialogs.length === 0) document.body.style.overflow = previousOverflow
      // Parent cleanup may run before its child. Keep the opener chain until the last cleanup.
      if (wasTop) restoreFocus(entry)
    }
  }, [])

  return { dialog, isTopDialog: () => dialogs[dialogs.length - 1]?.element === dialog.current }
}
