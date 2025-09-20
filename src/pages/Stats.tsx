import { useMemo } from 'react'

import { PerformanceCharts } from '../components/Charts'
import { useAppContext } from '../context/AppContext'
import type { MetricSnapshot, SessionMetrics } from '../types'

export function StatsPage() {
  const { state } = useAppContext()
  const { sessions, progress } = state

  const metrics = useMemo(() => summariseSessions(sessions), [sessions])
  const chartData = useMemo(() => buildSessionSnapshots(sessions), [sessions])
  const recentSessions = [...sessions].slice(-5).reverse()
  const weakKeys = progress.weakKeys.slice(0, 10)

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Performance Overview</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Track your historical typing metrics, spot trends, and let the trainer suggest where to focus next.
        </p>
      </header>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 sm:grid-cols-3">
        <StatCard label="Best WPM" value={metrics.bestWpm.toFixed(1)} helpText={metrics.bestLabel} />
        <StatCard label="Average Accuracy" value={`${metrics.averageAccuracy.toFixed(1)}%`} helpText={`${metrics.samples} sessions`} />
        <StatCard label="Consistent Combo" value={`${metrics.maxCombo}x`} helpText="Highest uninterrupted streak" />
      </section>

      <PerformanceCharts data={chartData} />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Recent Sessions</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">Last 5 entries</span>
          </header>
          <ul className="space-y-3">
            {recentSessions.length === 0 ? (
              <li className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Complete a practice sprint to populate your history.
              </li>
            ) : (
              recentSessions.map((session) => (
                <li
                  key={session.sessionId}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:-translate-y-[1px] hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-slate-700 dark:text-slate-100">
                      {formatDate(session.completedAt ?? session.startedAt)}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {session.lessonId ?? 'Custom sprint'}
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-y-1 font-mono text-xs">
                    <span className="text-slate-400">WPM</span>
                    <span className="text-right text-slate-600 dark:text-slate-200">{session.grossWpm.toFixed(1)}</span>
                    <span className="text-slate-400">Accuracy</span>
                    <span className="text-right text-slate-600 dark:text-slate-200">{session.accuracy.toFixed(1)}%</span>
                    <span className="text-slate-400">Errors</span>
                    <span className="text-right text-slate-600 dark:text-slate-200">{session.errorCount}</span>
                    <span className="text-slate-400">Net WPM</span>
                    <span className="text-right text-slate-600 dark:text-slate-200">{session.netWpm.toFixed(1)}</span>
                  </dl>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <header>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Recommended Focus</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Based on your most frequent mistakes and streak resets.
            </p>
          </header>
          <ul className="space-y-2">
            {weakKeys.length === 0 ? (
              <li className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                No weak keys detected. Keep maintaining consistency!
              </li>
            ) : (
              weakKeys.map((key) => (
                <li
                  key={key.key}
                  className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm font-mono text-rose-600 dark:bg-rose-900/40 dark:text-rose-200"
                >
                  <span className="font-semibold">{key.key}</span>
                  <span className="text-xs">miss {key.missCount} / acc {key.accuracy.toFixed(0)}%</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>
    </div>
  )
}

type StatCardProps = {
  label: string
  value: string
  helpText?: string
}

function StatCard({ label, value, helpText }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</h3>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {helpText ? <p className="text-xs text-slate-500 dark:text-slate-400">{helpText}</p> : null}
    </article>
  )
}

function summariseSessions(sessions: SessionMetrics[]) {
  if (sessions.length === 0) {
    return {
      bestWpm: 0,
      bestLabel: 'No sessions yet',
      averageAccuracy: 0,
      maxCombo: 0,
      samples: 0,
    }
  }

  const best = sessions.reduce((prev, current) => (current.grossWpm > prev.grossWpm ? current : prev))
  const totalAccuracy = sessions.reduce((sum, session) => sum + session.accuracy, 0)
  const maxCombo = sessions.reduce((max, session) => Math.max(max, session.weakKeys.reduce((combo, key) => Math.max(combo, key.streak), 0)), 0)

  return {
    bestWpm: best.grossWpm,
    bestLabel: formatDate(best.completedAt ?? best.startedAt),
    averageAccuracy: totalAccuracy / sessions.length,
    maxCombo,
    samples: sessions.length,
  }
}

function buildSessionSnapshots(sessions: SessionMetrics[]): MetricSnapshot[] {
  if (sessions.length === 0) {
    return []
  }
  return sessions.map((session) => {
    const minutes = session.durationMs / 60_000 || 1
    const cpm = session.totalKeystrokes / minutes
    return {
      timestamp: session.completedAt ?? session.startedAt,
      wpm: session.grossWpm,
      cpm,
      kpm: cpm,
      accuracy: session.accuracy,
      errors: session.errorCount,
      combo: session.weakKeys.reduce((max, key) => Math.max(max, key.streak), 0),
    }
  })
}

function formatDate(value?: string) {
  if (!value) {
    return 'Unknown'
  }
  const date = new Date(value)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`
}
