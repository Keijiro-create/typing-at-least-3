import type { WeakKeyStat } from '../types'

export type KeyPerformanceSample = {
  key: string
  timestamp: number
  isError: boolean
}

export type AggregationResult = {
  stats: WeakKeyStat[]
  weightedScores: Record<string, number>
}

type WorkingStat = {
  key: string
  missCount: number
  accuracy: number
  streak: number
  lastPracticedAt?: string
  attempts: number
  weightedScore: number
}

const RECENT_WINDOW_MS = 60_000
const WEIGHT_FALLBACK = 1
const MAX_TOP_KEYS = 5

/**
 * Usage:
 * const result = aggregateWeakKeys({ samples, previous: existingStats });
 * const weights = applyAdaptiveWeights({}, result.weightedScores);
 */
export function aggregateWeakKeys({
  samples,
  previous,
  referenceTime,
}: {
  samples: readonly KeyPerformanceSample[]
  previous?: readonly WeakKeyStat[]
  referenceTime?: number
}): AggregationResult {
  const working = new Map<string, WorkingStat>()
  const now = referenceTime ?? Date.now()

  if (previous) {
    for (const stat of previous) {
      const attempts = inferAttempts(stat)
      working.set(stat.key, {
        key: stat.key,
        missCount: stat.missCount,
        accuracy: stat.accuracy,
        streak: stat.streak,
        lastPracticedAt: stat.lastPracticedAt,
        attempts,
        weightedScore: stat.missCount,
      })
    }
  }

  const ordered = [...samples].sort((a, b) => a.timestamp - b.timestamp)

  for (const sample of ordered) {
    const entry = working.get(sample.key) ?? {
      key: sample.key,
      missCount: 0,
      accuracy: 100,
      streak: 0,
      attempts: 0,
      weightedScore: 0,
    }

    entry.attempts += 1
    entry.lastPracticedAt = new Date(sample.timestamp).toISOString()

    if (sample.isError) {
      entry.missCount += 1
      entry.streak = 0
      entry.weightedScore += calculateRecencyWeight(now - sample.timestamp)
    } else {
      entry.streak += 1
      entry.weightedScore = Math.max(WEIGHT_FALLBACK, entry.weightedScore * 0.95)
    }

    entry.accuracy = entry.attempts === 0 ? 100 : ((entry.attempts - entry.missCount) / entry.attempts) * 100

    working.set(sample.key, entry)
  }

  const stats: WeakKeyStat[] = []
  const weightedScores: Record<string, number> = {}

  for (const entry of working.values()) {
    const roundedAccuracy = Math.max(0, Math.min(100, entry.accuracy))
    stats.push({
      key: entry.key,
      missCount: entry.missCount,
      accuracy: roundedAccuracy,
      streak: entry.streak,
      lastPracticedAt: entry.lastPracticedAt,
    })
    weightedScores[entry.key] = entry.weightedScore
  }

  return { stats, weightedScores }
}

export function applyAdaptiveWeights(
  baseWeights: ReadonlyMap<string, number> | Record<string, number>,
  weightedScores: Record<string, number>,
  topN = MAX_TOP_KEYS,
): Map<string, number> {
  const result = new Map<string, number>()

  if (baseWeights instanceof Map) {
    for (const [key, value] of baseWeights.entries()) {
      result.set(key, value)
    }
  } else {
    for (const key of Object.keys(baseWeights)) {
      result.set(key, baseWeights[key])
    }
  }

  const entries = Object.entries(weightedScores)
    .filter(([, score]) => Number.isFinite(score) && score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)

  if (entries.length === 0) {
    return result
  }

  const multiplierRange = 0.5

  entries.forEach(([key], index) => {
    const base = result.get(key) ?? 1
    const factor = 1.5 + (multiplierRange * (entries.length - index - 1)) / Math.max(entries.length - 1, 1)
    result.set(key, base * factor)
  })

  return result
}

function calculateRecencyWeight(deltaMs: number): number {
  if (deltaMs <= 0) {
    return 2
  }

  const ratio = Math.max(0, 1 - deltaMs / RECENT_WINDOW_MS)
  return 1 + ratio
}

function inferAttempts(stat: WeakKeyStat): number {
  if (stat.missCount <= 0) {
    return Math.round(stat.accuracy >= 100 ? 0 : stat.missCount)
  }

  const accuracyRatio = Math.max(0.01, Math.min(0.99, stat.accuracy / 100))
  return Math.round(stat.missCount / (1 - accuracyRatio))
}
