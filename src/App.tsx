import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { UpdateToast } from './components/UpdateToast'

type ThemeMode = 'light' | 'dark'

const themeStorageKey = 'typing-trainer-theme'

const navigationItems: Array<{ to: string; label: string; end?: boolean }> = [
  { to: '/', label: 'Home', end: true },
  { to: '/practice', label: 'Practice' },
  { to: '/stats', label: 'Stats' },
  { to: '/settings', label: 'Settings' },
]

function detectInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const savedTheme = window.localStorage.getItem(themeStorageKey) as ThemeMode | null
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => detectInitialTheme())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark')
    window.localStorage.setItem(themeStorageKey, themeMode)
  }, [themeMode])

  const toggleTheme = () => {
    setThemeMode((previous) => (previous === 'dark' ? 'light' : 'dark'))
  }

  const themeLabel = useMemo(() => (themeMode === 'dark' ? 'ライトモード' : 'ダークモード'), [themeMode])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <NavLink to="/" end className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 font-black text-white shadow-lg">
              TT
            </span>
            <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Typing Trainer
            </span>
          </NavLink>

          <nav className="flex items-center gap-1 text-sm font-medium">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  'rounded-lg px-3 py-2 transition ' +
                  (isActive
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-sky-300 dark:hover:text-sky-300"
          >
            <span aria-hidden="true">{themeMode === 'dark' ? '🌙' : '☀️'}</span>
            <span>{themeLabel}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white/80 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
        © {new Date().getFullYear()} Typing Trainer. All rights reserved.
      </footer>

      <UpdateToast />
    </div>
  )
}
