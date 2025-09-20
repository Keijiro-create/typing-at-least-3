import { useEffect, useState } from 'react'

declare global {
  interface WindowEventMap {
    'sw:update': CustomEvent<ServiceWorker>
  }
}

export function UpdateToast() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ServiceWorker>
      setWaitingWorker(customEvent.detail)
      setVisible(true)
    }

    window.addEventListener('sw:update', handleUpdate as EventListener)
    return () => {
      window.removeEventListener('sw:update', handleUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!waitingWorker) {
      return
    }

    const handleControllerChange = () => {
      window.location.reload()
    }

    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange)
    return () => {
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [waitingWorker])

  if (!visible) {
    return null
  }

  const dismiss = () => setVisible(false)

  const reload = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' })
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-xs rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900"
    >
      <p className="font-semibold text-slate-800 dark:text-slate-100">Update available</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        A new version has been downloaded. Reload to apply the latest fixes and features.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={reload}
          className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white shadow transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-sky-400 dark:text-slate-900 dark:hover:bg-sky-300"
        >
          Reload
        </button>
      </div>
    </div>
  )
}
