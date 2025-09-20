export type ProgressBarProps = {
  value: number
  max: number
  label?: string
}

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(value, max))
  const percentage = max > 0 ? (clamped / max) * 100 : 0

  return (
    <div className="flex flex-col gap-1" aria-label={label ?? 'Progress'}>
      {label ? (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      ) : null}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <span
          className="absolute inset-y-0 left-0 block rounded-full bg-sky-500 transition-[width] duration-200 ease-out dark:bg-sky-400"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
        {Math.round(percentage)}%
      </span>
    </div>
  )
}
