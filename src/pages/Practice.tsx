import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Keyboard } from '../components/Keyboard'
import { MetricsBar, createSnapshot } from '../components/MetricsBar'
import { ProgressBar } from '../components/ProgressBar'
import { ResultModal } from '../components/ResultModal'
import { useAppContext } from '../context/AppContext'
import { aggregateWeakKeys } from '../lib/analyzer'
import { calculateMetrics } from '../lib/calc'
import { createIMEHandlers } from '../lib/ime'
import { t } from '../lib/i18n'
import type {
  KeyboardLayout,
  KeyPerformanceSample,
  MetricSnapshot,
  SessionPlan,
  SessionMetrics,
  SprintSetResult,
  TrainerSettings,
  WeakKeyStat,
} from '../types'

const SPRINT_PLAN: SessionPlan = {
  setLengthMs: 60_000,
  setCount: 3,
}

export const PRACTICE_STRINGS: readonly string[] = [
  'the quick brown fox jumps over the lazy dog 12345 and 67890 while jazz rhythms play softly.',
  'すばやい狐が林をかけ抜け、新月の夜には街角のミュージシャンが軽やかに演奏する。',
  'Practice steady keystrokes; focus on rhythm, reduce tension, and breathe evenly throughout the sprint.',
]

type RenderChar = {
  char: string
  state: 'pending' | 'current' | 'correct' | 'error'
}

type RunningCounters = {
  confirmedChars: number
  keystrokes: number
  errors: number
  combo: number
  maxCombo: number
}

const EMPTY_COUNTERS: RunningCounters = {
  confirmedChars: 0,
  keystrokes: 0,
  errors: 0,
  combo: 0,
  maxCombo: 0,
}

const EMPTY_METRICS = {
  wpm: 0,
  cpm: 0,
  kpm: 0,
  accuracy: 100,
  errors: 0,
  combo: 0,
  elapsedMs: 0,
}

export function PracticePage() {
  const { state, dispatch } = useAppContext()
  const settings: TrainerSettings = state.settings

  const [setIndex, setSetIndex] = useState(0)
  const [textCursor, setTextCursor] = useState(0)
  const [counters, setCounters] = useState<RunningCounters>(EMPTY_COUNTERS)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([])
  const [results, setResults] = useState<SprintSetResult[]>([])
  const [openResults, setOpenResults] = useState(false)
  const [pressedKeys, setPressedKeys] = useState<string[]>([])
  const [nextKeys, setNextKeys] = useState<string[]>([])
  const [heatVersion, setHeatVersion] = useState(0)

  const expectedText = PRACTICE_STRINGS[setIndex % PRACTICE_STRINGS.length]
  const hiddenInputRef = useRef<HTMLInputElement | null>(null)
  const textCursorRef = useRef(textCursor)
  const countersRef = useRef(counters)
  const startTimestampRef = useRef<number | null>(null)
  const rafRef = useRef<number>()
  const samplesRef = useRef<KeyPerformanceSample[]>([])
  const snapshotsRef = useRef<MetricSnapshot[]>([])
  const runningWeakKeysRef = useRef<Record<string, number>>({})
  const confirmRef = useRef<(text: string) => void>(() => {})
  const backspaceRef = useRef<() => void>(() => {})
  const imeHandlersRef = useRef<ReturnType<typeof createIMEHandlers> | null>(null)

  if (!imeHandlersRef.current) {
    imeHandlersRef.current = createIMEHandlers({
      onConfirm: (text) => confirmRef.current(text),
      onBackspace: () => backspaceRef.current(),
    })
  }
  const imeHandlers = imeHandlersRef.current!

  const reducedMotion = Boolean(settings.reducedMotion)

  const focusInput = useCallback(() => hiddenInputRef.current?.focus(), [])

  useEffect(() => {
    hiddenInputRef.current?.focus()
  }, [])

  useEffect(() => {
    textCursorRef.current = textCursor
  }, [textCursor])

  useEffect(() => {
    countersRef.current = counters
  }, [counters])

  useEffect(() => {
    const sessionId = `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
    dispatch({ type: 'session/start', payload: { sessionId, lessonId: 'practice-sprint' } })
  }, [dispatch])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const label = (event.key.length === 1 ? event.key : event.code).toLowerCase()
      setPressedKeys((prev) => (prev.includes(label) ? prev : [...prev, label]))
      if (event.key === 'Backspace' || event.key === 'Tab') {
        event.preventDefault()
      }
    }
    const keyup = (event: KeyboardEvent) => {
      const label = (event.key.length === 1 ? event.key : event.code).toLowerCase()
      setPressedKeys((prev) => prev.filter((item) => item !== label))
    }
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    return () => {
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
    }
  }, [])

  useEffect(() => {
    startTimestampRef.current = performance.now()
    samplesRef.current = []
    snapshotsRef.current = []
    setElapsedMs(0)
    setTextCursor(0)
    textCursorRef.current = 0
    setCounters(EMPTY_COUNTERS)
    countersRef.current = EMPTY_COUNTERS
    const firstChar = expectedText.charAt(0)
    setNextKeys(firstChar ? [firstChar.toLowerCase()] : [])
    focusInput()

    const tick = () => {
      if (startTimestampRef.current === null) {
        return
      }
      const elapsed = performance.now() - startTimestampRef.current
      setElapsedMs(elapsed)
      if (elapsed >= SPRINT_PLAN.setLengthMs || textCursor >= expectedText.length) {
        finalizeSet()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIndex, expectedText])

  const renderChars: RenderChar[] = useMemo(() => {
    return expectedText.split('').map((char, index) => {
      if (index < textCursor) {
        return {
          char,
          state: samplesRef.current[index]?.isError ? 'error' : 'correct',
        }
      }
      if (index === textCursor) {
        return { char, state: 'current' }
      }
      return { char, state: 'pending' }
    })
  }, [expectedText, textCursor])

  const metrics = useMemo(() => {
    if (counters.keystrokes === 0) {
      return { ...EMPTY_METRICS, elapsedMs }
    }
    const computed = calculateMetrics({
      confirmedCharCount: counters.confirmedChars,
      totalKeystrokes: counters.keystrokes,
      errorCount: counters.errors,
      elapsedMs: Math.max(elapsedMs, 1),
    })
    return {
      wpm: computed.wpm,
      cpm: computed.cpm,
      kpm: computed.kpm,
      accuracy: computed.accuracy,
      errors: counters.errors,
      combo: counters.combo,
      elapsedMs,
    }
  }, [counters, elapsedMs])

  const heatmap = useMemo(() => buildHeatmap(results, runningWeakKeysRef.current), [results, heatVersion])

  function handleCharacter(char: string) {
    if (!startTimestampRef.current) {
      startTimestampRef.current = performance.now()
    }

    const currentCursor = textCursorRef.current
    const expectedChar = expectedText.charAt(currentCursor)
    const isCorrect = expectedChar === char

    const currentCounters = countersRef.current
    const newCounters: RunningCounters = {
      confirmedChars: currentCounters.confirmedChars + 1,
      keystrokes: currentCounters.keystrokes + 1,
      errors: currentCounters.errors + (isCorrect ? 0 : 1),
      combo: isCorrect ? currentCounters.combo + 1 : 0,
      maxCombo: isCorrect ? Math.max(currentCounters.maxCombo, currentCounters.combo + 1) : currentCounters.maxCombo,
    }

    countersRef.current = newCounters
    setCounters(newCounters)

    const nextCursor = currentCursor + 1
    textCursorRef.current = nextCursor
    setTextCursor(nextCursor)

    const elapsed = performance.now() - (startTimestampRef.current ?? performance.now())
    const metricsNow = calculateMetrics({
      confirmedCharCount: newCounters.confirmedChars,
      totalKeystrokes: newCounters.keystrokes,
      errorCount: newCounters.errors,
      elapsedMs: Math.max(elapsed, 1),
    })

    const snapshot = createSnapshot({
      wpm: metricsNow.wpm,
      cpm: metricsNow.cpm,
      kpm: metricsNow.kpm,
      accuracy: metricsNow.accuracy,
      errors: newCounters.errors,
      combo: newCounters.combo,
      elapsedMs: elapsed,
    })

    snapshotsRef.current.push(snapshot)
    setSnapshots([...snapshotsRef.current])

    samplesRef.current.push({
      key: (expectedChar || char || '').toLowerCase(),
      timestamp: Date.now(),
      isError: !isCorrect,
    })

    if (!isCorrect) {
      const key = (expectedChar || char).toLowerCase()
      runningWeakKeysRef.current[key] = (runningWeakKeysRef.current[key] ?? 0) + 1
      setHeatVersion((version) => version + 1)
    }

    const primary = expectedText.charAt(nextCursor)
    const secondary = expectedText.charAt(nextCursor + 1)
    const nextKeyHints: string[] = []
    if (primary) {
      nextKeyHints.push(primary.toLowerCase())
    }
    if (secondary) {
      nextKeyHints.push(secondary.toLowerCase())
    }
    setNextKeys(nextKeyHints)

    dispatch({
      type: 'session/record',
      payload: {
        confirmedCharDelta: 1,
        keystrokeDelta: 1,
        errorDelta: isCorrect ? 0 : 1,
        combo: newCounters.combo,
        lastInputAt: new Date().toISOString(),
        snapshot,
      },
    })

    if (nextCursor >= expectedText.length) {
      finalizeSet()
    }
  }

  function handleConfirm(text: string) {
    for (const char of Array.from(text)) {
      handleCharacter(char)
    }
  }

  function handleBackspace() {
    setCounters((prev) => {
      if (prev.combo === 0) {
        return prev
      }
      const next = { ...prev, combo: 0 }
      countersRef.current = next
      return next
    })
  }

  confirmRef.current = handleConfirm
  backspaceRef.current = handleBackspace


  function finalizeSet() {
    if (startTimestampRef.current === null) {
      return
    }

    const elapsed = performance.now() - startTimestampRef.current
    const aggregated = aggregateWeakKeys({ samples: samplesRef.current })

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = undefined
    }

    const currentCounters = countersRef.current

    const summaryMetrics = calculateMetrics({
      confirmedCharCount: currentCounters.confirmedChars,
      totalKeystrokes: currentCounters.keystrokes,
      errorCount: currentCounters.errors,
      elapsedMs: Math.max(elapsed, 1),
      expectedElapsedMs: SPRINT_PLAN.setLengthMs,
    })

    const summarySnapshot = createSnapshot({
      wpm: summaryMetrics.wpm,
      cpm: summaryMetrics.cpm,
      kpm: summaryMetrics.kpm,
      accuracy: summaryMetrics.accuracy,
      errors: currentCounters.errors,
      combo: currentCounters.maxCombo,
      elapsedMs: elapsed,
    })

    const result: SprintSetResult = {
      setIndex,
      startedAt: new Date((startTimestampRef.current ?? performance.now())).toISOString(),
      endedAt: new Date().toISOString(),
      metrics: summarySnapshot,
      weakKeys: aggregated.stats,
    }

    setResults((prev) => {
      const next = [...prev.filter((entry) => entry.setIndex !== setIndex), result]
      if (next.length === SPRINT_PLAN.setCount) {
        setOpenResults(true)
      }
      return next
    })

    dispatch({ type: 'progress/mergeWeakKeys', payload: aggregated.stats })

    samplesRef.current = []
    snapshotsRef.current = []
    runningWeakKeysRef.current = {}
    startTimestampRef.current = null

    if (setIndex + 1 < SPRINT_PLAN.setCount) {
      setSetIndex((prev) => prev + 1)
    } else {
      closeSession(result, aggregated.stats)
    }
  }

  function closeSession(lastResult: SprintSetResult, weakKeys: WeakKeyStat[]) {
    const allResults = [...results.filter((entry) => entry.setIndex !== lastResult.setIndex), lastResult]
    const totals = allResults.reduce(
      (acc, item) => {
        acc.wpm += item.metrics.wpm
        acc.accuracy += item.metrics.accuracy
        acc.kpm += item.metrics.kpm
        acc.cpm += item.metrics.cpm
        acc.errors += item.metrics.errors
        acc.combo = Math.max(acc.combo, item.metrics.combo)
        return acc
      },
      { wpm: 0, accuracy: 0, kpm: 0, cpm: 0, errors: 0, combo: 0 },
    )

    const averageWpm = totals.wpm / allResults.length
    const averageAccuracy = totals.accuracy / allResults.length
    const combinedWeakKeys = combineWeakKeyStats(allResults.map((entry) => entry.weakKeys))

    const sessionMetrics: SessionMetrics = {
      sessionId: state.session?.sessionId ?? `practice-${Date.now()}`,
      lessonId: state.session?.lessonId,
      phraseListId: state.session?.phraseListId,
      startedAt: state.session?.startedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: SPRINT_PLAN.setLengthMs * SPRINT_PLAN.setCount,
      grossWpm: averageWpm,
      netWpm: averageWpm * (averageAccuracy / 100),
      accuracy: averageAccuracy,
      totalKeystrokes: totals.cpm * (SPRINT_PLAN.setLengthMs * allResults.length / 60_000),
      errorCount: totals.errors,
      weakKeys: combinedWeakKeys.length > 0 ? combinedWeakKeys : weakKeys,
    }

    dispatch({ type: 'session/end', payload: sessionMetrics })
  }

  function resetSprint() {
    setSetIndex(0)
    setResults([])
    setOpenResults(false)
    setCounters(EMPTY_COUNTERS)
    countersRef.current = EMPTY_COUNTERS
    setTextCursor(0)
    textCursorRef.current = 0
    setSnapshots([])
    samplesRef.current = []
    snapshotsRef.current = []
    runningWeakKeysRef.current = {}
    startTimestampRef.current = performance.now()
    focusInput()
  }

  const progressValue = textCursor
  const progressMax = expectedText.length

  return (
    <div className="space-y-8" role="main">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('session.start')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          IME confirmed characters only count toward your score. Backspace never subtracts points. Complete three one-minute sprints and compare each set side by side.
        </p>
      </header>

      <MetricsBar metrics={metrics} goalWpm={settings.sprintGoalWpm} reducedMotion={reducedMotion} />

      <section className="grid gap-4 font-mono text-base text-slate-900 dark:text-slate-100 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div
            className="rounded-3xl border border-slate-300 bg-white/90 p-6 shadow-inner transition-colors dark:border-slate-700 dark:bg-slate-900/70"
            role="region"
            aria-label="Practice field"
            onClick={focusInput}
          >
            <input
              ref={hiddenInputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="sr-only"
              aria-hidden="true"
              onPaste={(event) => event.preventDefault()}
              onDrop={(event) => event.preventDefault()}
              onCopy={(event) => event.preventDefault()}
              onCut={(event) => event.preventDefault()}
              onBeforeInput={(event) => imeHandlers.onBeforeInput(event.nativeEvent as InputEvent)}
              onCompositionStart={() => imeHandlers.onCompositionStart()}
              onCompositionEnd={() => imeHandlers.onCompositionEnd()}
              onKeyDown={(event) => imeHandlers.onKeyDown(event.nativeEvent as KeyboardEvent)}
            />
            <p className="min-h-[160px] whitespace-pre-wrap break-words leading-relaxed">
              {renderChars.map((segment, index) => (
                <span
                  key={index}
                  className={
                    segment.state === 'correct'
                      ? 'text-slate-400'
                      : segment.state === 'current'
                      ? 'relative underline decoration-2 underline-offset-[6px] decoration-sky-400'
                      : segment.state === 'error'
                      ? 'text-rose-500 underline decoration-wavy decoration-rose-500'
                      : 'text-slate-500'
                  }
                >
                  {segment.char === ' ' ? ' ' : segment.char}
                </span>
              ))}
            </p>
            <div className="mt-4">
              <ProgressBar value={progressValue} max={progressMax} label="Text progress" />
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-slate-300 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 sm:grid-cols-3">
            {Array.from({ length: SPRINT_PLAN.setCount }, (_, idx) => {
              const record = results.find((entry) => entry.setIndex === idx)
              const isActive = idx === setIndex
              return (
                <article
                  key={idx}
                  className={
                    'rounded-2xl border px-4 py-3 text-xs transition dark:border-slate-700 ' +
                    (record
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : isActive
                      ? 'border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200'
                      : 'border-slate-200 bg-white text-slate-500 dark:bg-slate-900/80 dark:text-slate-300')
                  }
                >
                  <header className="flex items-center justify-between">
                    <span className="font-semibold uppercase tracking-wider">Set {idx + 1}</span>
                    {record ? <span className="text-[10px]">Done</span> : isActive ? <span className="text-[10px]">Live</span> : null}
                  </header>
                  {record ? (
                    <dl className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs">
                      <span className="text-slate-400">WPM</span>
                      <span className="text-right text-slate-600 dark:text-slate-200">{record.metrics.wpm.toFixed(1)}</span>
                      <span className="text-slate-400">ACC</span>
                      <span className="text-right text-slate-600 dark:text-slate-200">{record.metrics.accuracy.toFixed(0)}%</span>
                    </dl>
                  ) : (
                    <p className="mt-2 text-slate-400">Awaiting sprint</p>
                  )}
                </article>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={resetSprint}
              className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Reset Sprint
            </button>
            <span aria-live="polite">Set {setIndex + 1} / {SPRINT_PLAN.setCount}</span>
            <span>{(elapsedMs / 1000).toFixed(1)}s elapsed</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Keyboard
            layout={settings.keyboardLayout as KeyboardLayout}
            nextKeys={reducedMotion ? [] : nextKeys}
            pressedKeys={pressedKeys}
            heatmap={heatmap}
            onLayoutChange={(layout) => dispatch({ type: 'settings/update', payload: { keyboardLayout: layout } })}
          />
        </div>
      </section>

      <ResultModal
        open={openResults}
        onClose={() => setOpenResults(false)}
        results={results}
        snapshots={snapshots}
      />
    </div>
  )
}

function buildHeatmap(results: SprintSetResult[], current: Record<string, number>): Record<string, number> {
  const map: Record<string, number> = {}
  for (const result of results) {
    for (const stat of result.weakKeys) {
      map[stat.key.toLowerCase()] = Math.min(1, (map[stat.key.toLowerCase()] ?? 0) + stat.missCount / 10)
    }
  }
  for (const [key, value] of Object.entries(current)) {
    map[key.toLowerCase()] = Math.min(1, (map[key.toLowerCase()] ?? 0) + value / 5)
  }
  return map
}

function combineWeakKeyStats(groups: WeakKeyStat[][]): WeakKeyStat[] {
  const map = new Map<string, WeakKeyStat>()
  for (const group of groups) {
    for (const stat of group) {
      const existing = map.get(stat.key)
      if (!existing) {
        map.set(stat.key, { ...stat })
      } else {
        map.set(stat.key, {
          ...existing,
          missCount: existing.missCount + stat.missCount,
          accuracy: Math.min(existing.accuracy, stat.accuracy),
          streak: Math.max(existing.streak, stat.streak),
          lastPracticedAt: stat.lastPracticedAt ?? existing.lastPracticedAt,
        })
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.missCount - a.missCount)
}
