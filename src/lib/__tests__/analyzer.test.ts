import { describe, expect, it } from 'vitest'

import { aggregateWeakKeys, applyAdaptiveWeights } from '../analyzer'

const now = Date.now()

describe('aggregateWeakKeys', () => {
  it('combines previous stats with new samples, weighting recent mistakes higher', () => {
    const samples = [
      { key: 'f', timestamp: now - 1_000, isError: true },
      { key: 'f', timestamp: now - 20_000, isError: false },
      { key: 'j', timestamp: now - 2_000, isError: true },
    ]

    const previous = [
      { key: 'f', missCount: 2, accuracy: 80, streak: 3, lastPracticedAt: new Date(now - 10_000).toISOString() },
    ]

    const aggregated = aggregateWeakKeys({ samples, previous, referenceTime: now })

    const fStat = aggregated.stats.find((stat) => stat.key === 'f')
    const jStat = aggregated.stats.find((stat) => stat.key === 'j')

    expect(fStat?.missCount).toBeGreaterThanOrEqual(2)
    expect(jStat?.missCount).toBe(1)
    expect(aggregated.weightedScores['f']).toBeGreaterThan(aggregated.weightedScores['j'])
  })
})

describe('applyAdaptiveWeights', () => {
  it('boosts the highest weighted keys within the provided map', () => {
    const baseWeights = new Map<string, number>([
      ['f', 1],
      ['j', 1],
    ])

    const weightedScores = {
      f: 3,
      j: 1,
      k: 0.5,
    }

    const result = applyAdaptiveWeights(baseWeights, weightedScores, 2)

    expect(result.get('f')).toBeGreaterThan(result.get('j') ?? 0)
    expect(result.get('f')).toBeGreaterThan(1)
    expect(result.get('j')).toBeGreaterThan(1)
  })
})
