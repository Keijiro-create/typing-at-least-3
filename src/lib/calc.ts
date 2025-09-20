export type DriftCorrectionInput = {
  rawElapsedMs: number
  expectedElapsedMs?: number
}

export type MetricInput = {
  confirmedCharCount: number
  totalKeystrokes: number
  errorCount: number
  elapsedMs: number
  expectedElapsedMs?: number
}

export type Metrics = {
  elapsedMs: number
  wpm: number
  cpm: number
  kpm: number
  accuracy: number
}

const MILLIS_PER_MINUTE = 60_000
const WORD_SIZE = 5
const MAX_DRIFT_PER_SECOND = 10

/**
 * Usage:
 * const metrics = calculateMetrics({ confirmedCharCount: 120, totalKeystrokes: 150, errorCount: 5, elapsedMs: 65_000 });
 */
export function calculateMetrics(input: MetricInput): Metrics {
  const correctedElapsedMs = applyDriftCorrection({
    rawElapsedMs: input.elapsedMs,
    expectedElapsedMs: input.expectedElapsedMs,
  })

  const minutes = Math.max(correctedElapsedMs, 1) / MILLIS_PER_MINUTE

  const cpm = input.confirmedCharCount / minutes
  const kpm = input.totalKeystrokes / minutes
  const wpm = (input.confirmedCharCount / WORD_SIZE) / minutes
  const accuracy = calculateAccuracy(input.totalKeystrokes, input.errorCount)

  return {
    elapsedMs: correctedElapsedMs,
    wpm,
    cpm,
    kpm,
    accuracy,
  }
}

export function applyDriftCorrection({ rawElapsedMs, expectedElapsedMs }: DriftCorrectionInput): number {
  if (typeof expectedElapsedMs !== 'number') {
    return rawElapsedMs
  }

  const drift = rawElapsedMs - expectedElapsedMs
  const limit = Math.abs(rawElapsedMs) / 1000 * MAX_DRIFT_PER_SECOND

  if (Math.abs(drift) <= limit) {
    return expectedElapsedMs
  }

  return rawElapsedMs - Math.sign(drift) * limit
}

export function calculateAccuracy(totalKeystrokes: number, errorCount: number): number {
  if (totalKeystrokes <= 0) {
    return 100
  }

  const correct = Math.max(totalKeystrokes - errorCount, 0)
  return (correct / totalKeystrokes) * 100
}
