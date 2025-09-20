import { Fragment } from 'react'

import type { MetricSnapshot, SprintSetResult, WeakKeyStat } from '../types'
import { PerformanceCharts } from './Charts'

export type ResultModalProps = {
  open: boolean
  onClose: () => void
  results: SprintSetResult[]
  snapshots: MetricSnapshot[]
}

function formatDuration(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt).getTime()
  const end = new Date(endedAt).getTime()
  const delta = Math.max(0, end - start)
  return `${Math.round(delta / 1000)}s`
}

function formatNumber(value: number, fraction = 1): string {
  return value.toFixed(fraction)
}

export function ResultModal({ open, onClose, results, snapshots }: ResultModalProps) {
  if (!open) {
    return null
  }

  const best = [...results].sort((a, b) => b.metrics.wpm - a.metrics.wpm)[0]
  const topMissKeys = gatherTopMissKeys(results, 10)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
    >
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-full w-full max-w-4xl flex-col gap-6 overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="result-title" className="text-2xl font-bold text-slate-900 dark:text-white">
              Sprint Summary
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Review your three-set sprint and focus on the highlighted weak keys next session.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </header>

        <section className="grid gap-4 rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-slate-900/70 sm:grid-cols-3">
          {results.map((result) => (
            <article
              key={result.setIndex}
              className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60"
            >
              <header className="mb-2 flex items-center justify-between font-mono text-xs text-slate-500 dark:text-slate-400">
                <span>Set {result.setIndex + 1}</span>
                <span>{formatDuration(result.startedAt, result.endedAt)}</span>
              </header>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <Metric label="WPM" value={formatNumber(result.metrics.wpm)} highlighted={best?.setIndex === result.setIndex} />
                <Metric label="CPM" value={formatNumber(result.metrics.cpm)} />
                <Metric label="Accuracy" value={`${formatNumber(result.metrics.accuracy)}%`} />
                <Metric label="Errors" value={result.metrics.errors.toString()} />
                <Metric label="Combo" value={result.metrics.combo.toString()} />
                <Metric label="KPM" value={formatNumber(result.metrics.kpm)} />
              </dl>
            </article>
          ))}
        </section>

        <PerformanceCharts data={snapshots} />

        <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <header className="mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Top 10 Weak Keys</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Weighted by recent mistakes. Higher bars indicate more focus recommended.
            </p>
          </header>
          <ul className="grid gap-2 sm:grid-cols-2">
            {topMissKeys.map((entry) => (
              <li
                key={entry.key}
                className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <span className="font-semibold">{entry.key}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  misses {entry.missCount} / acc {formatNumber(entry.accuracy, 0)}%
                </span>
              </li>
            ))}
            {topMissKeys.length === 0 ? (
              <li className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                No weak keys detected in this sprint. Great job!
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  )
}

type MetricProps = {
  label: string
  value: string
  highlighted?: boolean
}

function Metric({ label, value, highlighted }: MetricProps) {
  return (
    <Fragment>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd
        className={
          'text-sm font-semibold text-slate-900 dark:text-white ' +
          (highlighted ? 'text-emerald-500 dark:text-emerald-400' : '')
        }
      >
        {value}
      </dd>
    </Fragment>
  )
}

function gatherTopMissKeys(results: SprintSetResult[], limit: number): WeakKeyStat[] {
  const map = new Map<string, WeakKeyStat>()
  for (const result of results) {
    for (const stat of result.weakKeys) {
      const existing = map.get(stat.key)
      if (!existing) {
        map.set(stat.key, { ...stat })
      } else {
        map.set(stat.key, {
          ...existing,
          missCount: existing.missCount + stat.missCount,
          accuracy: Math.min(existing.accuracy, stat.accuracy),
          streak: Math.min(existing.streak, stat.streak),
          lastPracticedAt: existing.lastPracticedAt ?? stat.lastPracticedAt,
        })
      }
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.missCount - a.missCount)
    .slice(0, limit)
}
