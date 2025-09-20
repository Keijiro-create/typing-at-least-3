import { useMemo, useState } from 'react'

import { DataImporter } from '../components/DataImporter'
import { useAppContext, useStorageExport } from '../context/AppContext'
import type { TrainerSettings } from '../types'

const THEMES: Array<{ value: TrainerSettings['theme']; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const LANGUAGES: Array<{ value: TrainerSettings['language']; label: string }> = [
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'English' },
]

const LAYOUTS: Array<{ value: TrainerSettings['keyboardLayout']; label: string }> = [
  { value: 'jis', label: 'JIS' },
  { value: 'us', label: 'US' },
]

export function SettingsPage() {
  const { state, dispatch } = useAppContext()
  const exportPayload = useStorageExport()
  const [message, setMessage] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const downloadHref = useMemo(() => {
    return `data:application/json;charset=utf-8,${encodeURIComponent(exportPayload)}`
  }, [exportPayload])

  const handleSettingChange = <K extends keyof TrainerSettings>(key: K, value: TrainerSettings[K]) => {
    dispatch({ type: 'settings/update', payload: { [key]: value } as Partial<TrainerSettings> })
    setMessage('Settings updated')
  }

  const handleExport = () => {
    setMessage('Export file generated. Download will start automatically.')
  }

  const handleImport = (files: Array<{ name: string; type: 'json' | 'text'; content: string }>) => {
    setImportError(null)
    const file = files.find((item) => item.type === 'json') ?? files[0]
    if (!file) {
      setImportError('No JSON file detected.')
      return
    }

    try {
      const parsed = JSON.parse(file.content) as {
        schemaVersion?: number
        settings?: TrainerSettings
        progress?: typeof state.progress
        sessions?: typeof state.sessions
      }

      if (!parsed.settings || !parsed.progress || !parsed.sessions) {
        throw new Error('Missing keys in imported data.')
      }

      dispatch({ type: 'settings/replace', payload: parsed.settings })
      dispatch({ type: 'progress/set', payload: parsed.progress })
      dispatch({ type: 'sessions/replace', payload: parsed.sessions })
      setMessage(`Imported ${file.name} successfully.`)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import file.')
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings &amp; Data</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Customise your typing experience, update accessibility preferences, and manage your training data.
        </p>
      </header>

      {message ? (
        <div role="status" className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/40 dark:text-emerald-200">
          {message}
        </div>
      ) : null}
      {importError ? (
        <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500 dark:bg-rose-900/40 dark:text-rose-200">
          {importError}
        </div>
      ) : null}

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 lg:grid-cols-2">
        <form className="space-y-4" autoComplete="off">
          <SettingField label="Language">
            <div className="flex gap-2">
              {LANGUAGES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSettingChange('language', option.value)}
                  className={
                    'rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ' +
                    (state.settings.language === option.value
                      ? 'bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-900'
                      : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800')
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </SettingField>

          <SettingField label="Theme">
            <div className="flex gap-2">
              {THEMES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSettingChange('theme', option.value)}
                  className={
                    'rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ' +
                    (state.settings.theme === option.value
                      ? 'bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-900'
                      : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800')
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </SettingField>

          <SettingField label="Audio cues">
            <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                className="size-4"
                checked={state.settings.sound}
                onChange={(event) => handleSettingChange('sound', event.target.checked)}
              />
              <span>Play gentle click when a mistake occurs</span>
            </label>
          </SettingField>

          <SettingField label="Target WPM">
            <input
              type="number"
              min={10}
              max={220}
              step={5}
              value={state.settings.sprintGoalWpm}
              onChange={(event) => handleSettingChange('sprintGoalWpm', Number(event.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            />
          </SettingField>

          <SettingField label="Keyboard layout">
            <div className="flex gap-2">
              {LAYOUTS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSettingChange('keyboardLayout', option.value)}
                  className={
                    'rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ' +
                    (state.settings.keyboardLayout === option.value
                      ? 'bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-900'
                      : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800')
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </SettingField>

          <SettingField label="Reduce motion">
            <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                className="size-4"
                checked={Boolean(state.settings.reducedMotion)}
                onChange={(event) => handleSettingChange('reducedMotion', event.target.checked)}
              />
              <span>Disable animated highlights in practice view</span>
            </label>
          </SettingField>
        </form>

        <div className="space-y-4">
          <SettingField label="Export data">
            <a
              href={downloadHref}
              download={`typing-trainer-${new Date().toISOString()}.json`}
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Download JSON
            </a>
          </SettingField>

          <SettingField label="Import data">
            <DataImporter onImport={handleImport} helperText="Drag & drop exported JSON here or select a file." />
          </SettingField>

          <SettingField label="Danger zone">
            <button
              type="button"
              onClick={() => dispatch({ type: 'storage/clear' })}
              className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 dark:border-rose-500 dark:bg-rose-900/40 dark:text-rose-200"
            >
              Clear progress &amp; sessions
            </button>
          </SettingField>
        </div>
      </section>
    </div>
  )
}

type SettingFieldProps = {
  label: string
  children: React.ReactNode
}

function SettingField({ label, children }: SettingFieldProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {label}
      </h2>
      {children}
    </div>
  )
}
