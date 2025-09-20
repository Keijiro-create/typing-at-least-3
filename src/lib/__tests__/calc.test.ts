import { describe, expect, it } from 'vitest'

import { applyDriftCorrection, calculateAccuracy, calculateMetrics } from '../calc'

describe('calculateMetrics', () => {
  it('calculates typing metrics with drift correction', () => {
    const metrics = calculateMetrics({
      confirmedCharCount: 250,
      totalKeystrokes: 280,
      errorCount: 10,
      elapsedMs: 62_000,
      expectedElapsedMs: 60_000,
    })

    expect(metrics.elapsedMs).toBe(60_000)
    expect(metrics.wpm).toBeCloseTo((250 / 5) / 1, 5)
    expect(metrics.cpm).toBeCloseTo(250 / 1, 5)
    expect(metrics.kpm).toBeCloseTo(280 / 1, 5)
    expect(metrics.accuracy).toBeCloseTo(((280 - 10) / 280) * 100, 5)
  })
})

describe('applyDriftCorrection', () => {
  it('limits drift to threshold when deviation is large', () => {
    const corrected = applyDriftCorrection({ rawElapsedMs: 120_000, expectedElapsedMs: 100_000 })
    expect(corrected).toBeLessThan(120_000)
    expect(corrected).toBeGreaterThan(100_000)
  })

  it('returns expected elapsed when drift is small', () => {
    const corrected = applyDriftCorrection({ rawElapsedMs: 101_000, expectedElapsedMs: 100_000 })
    expect(corrected).toBe(100_000)
  })
})

describe('calculateAccuracy', () => {
  it('returns 100 when no keystrokes recorded', () => {
    expect(calculateAccuracy(0, 10)).toBe(100)
  })

  it('calculates accuracy with safeguards against negative values', () => {
    expect(calculateAccuracy(50, 5)).toBeCloseTo(90)
    expect(calculateAccuracy(10, 20)).toBe(0)
  })
})
