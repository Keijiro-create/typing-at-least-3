import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { AppProvider } from './context/AppContext'
import './styles/index.css'
import { router } from './router.tsx'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Failed to find the root element to mount the React app.')
}

createRoot(container).render(
  <StrictMode>
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const notifyUpdate = (worker: ServiceWorker) => {
    window.dispatchEvent(new CustomEvent('sw:update', { detail: worker }))
  }

  window.addEventListener('load', () => {
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(new URL('./sw.ts', import.meta.url), {
          type: 'module',
        })

        if (registration.waiting && navigator.serviceWorker.controller) {
          notifyUpdate(registration.waiting)
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) {
            return
          }
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              notifyUpdate(newWorker)
            }
          })
        })
      } catch (error) {
        console.error('Service worker registration failed', error)
      }
    }

    window.setTimeout(register, 1200)
  })
}
