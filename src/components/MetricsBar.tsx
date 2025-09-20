import type { MetricSnapshot } from '../types'

export type MetricsBarProps = {
  metrics: {
    wpm: number
    cpm: number
    kpm: number
    accuracy: number
    errors: number
    combo: number
    elapsedMs: number
  }
  goalWpm?: number
  reducedMotion?: boolean
}

const metricLabels: Array<{ key: keyof MetricsBarProps['metrics']; label: string; unit?: string }> = [
  { key: 'wpm', label: 'WPM' },
  { key: 'cpm', label: 'CPM' },
  { key: 'kpm', label: 'KPM' },
  { key: 'accuracy', label: 'Accuracy', unit: '%' },
  { key: 'errors', label: 'Errors' },
  { key: 'combo', label: 'Combo' },
  { key: 'elapsedMs', label: 'Elapsed', unit: 's' },
]

function formatValue(key: keyof MetricsBarProps['metrics'], value: number): string {
  if (key === 'accuracy') {
    return value.toFixed(1)
  }
  if (key === 'elapsedMs') {
    return (value / 1000).toFixed(1)
  }
  if (key === 'errors' || key === 'combo') {
    return Math.round(value).toString()
  }
  return value.toFixed(1)
}

export function MetricsBar({ metrics, goalWpm, reducedMotion }: MetricsBarProps) {
  const isGoalMet = goalWpm ? metrics.wpm >= goalWpm : false

  return (
    <section
      aria-live="polite"
      className="grid gap-2 rounded-2xl border border-slate-200 bg-white/90 p-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 sm:grid-cols-3 lg:grid-cols-7"
    >
      {metricLabels.map(({ key, label, unit }) => {
        const display = formatValue(key, metrics[key])
        const isGoalMetric = key === 'wpm'
        return (
          <div
            key={key}
            className="flex flex-col items-start justify-center rounded-lg px-2 py-1 font-mono text-xs text-slate-600 dark:text-slate-300"
          >
            <span className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {label}
            </span>
            <span
              className={
                'text-lg font-semibold text-slate-900 transition-colors dark:text-white ' +
                (isGoalMetric && goalWpm
                  ? isGoalMet
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-sky-600 dark:text-sky-300'
                  : '')
              }
            >
              {display}
              {unit ? <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">{unit}</span> : null}
            </span>
            {isGoalMetric && goalWpm ? (
              <span className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Goal {goalWpm} WPM
              </span>
            ) : null}
          </div>
        )
      })}
    </section>
  )
}

export function createSnapshot(metrics: MetricsBarProps['metrics']): MetricSnapshot {
  return {
    timestamp: new Date().toISOString(),
    wpm: metrics.wpm,
    cpm: metrics.cpm,
    kpm: metrics.kpm,
    accuracy: metrics.accuracy,
    errors: metrics.errors,
    combo: metrics.combo,
  }
}
