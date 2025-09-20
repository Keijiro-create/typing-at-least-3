import { useMemo } from 'react'

import type { KeyboardLayout } from '../types'

export type KeyboardProps = {
  layout: KeyboardLayout
  nextKeys: readonly string[]
  pressedKeys: readonly string[]
  heatmap?: Record<string, number>
  onLayoutChange?: (layout: KeyboardLayout) => void
}

type KeyDescriptor = {
  label: string
  width?: number
}

const layouts: Record<KeyboardLayout, KeyDescriptor[][]> = {
  us: [
    [
      { label: '`' },
      { label: '1' },
      { label: '2' },
      { label: '3' },
      { label: '4' },
      { label: '5' },
      { label: '6' },
      { label: '7' },
      { label: '8' },
      { label: '9' },
      { label: '0' },
      { label: '-' },
      { label: '=' },
      { label: 'Backspace', width: 1.5 },
    ],
    [
      { label: 'Tab', width: 1.2 },
      { label: 'Q' },
      { label: 'W' },
      { label: 'E' },
      { label: 'R' },
      { label: 'T' },
      { label: 'Y' },
      { label: 'U' },
      { label: 'I' },
      { label: 'O' },
      { label: 'P' },
      { label: '[' },
      { label: ']' },
      { label: '\\', width: 1.3 },
    ],
    [
      { label: 'Caps', width: 1.4 },
      { label: 'A' },
      { label: 'S' },
      { label: 'D' },
      { label: 'F' },
      { label: 'G' },
      { label: 'H' },
      { label: 'J' },
      { label: 'K' },
      { label: 'L' },
      { label: ';' },
      { label: "'" },
      { label: 'Enter', width: 1.6 },
    ],
    [
      { label: 'Shift', width: 1.8 },
      { label: 'Z' },
      { label: 'X' },
      { label: 'C' },
      { label: 'V' },
      { label: 'B' },
      { label: 'N' },
      { label: 'M' },
      { label: ',' },
      { label: '.' },
      { label: '/' },
      { label: 'Shift', width: 1.8 },
    ],
    [
      { label: 'Ctrl', width: 1.1 },
      { label: 'Win', width: 1.1 },
      { label: 'Alt', width: 1.1 },
      { label: 'Space', width: 4 },
      { label: 'Alt', width: 1.1 },
      { label: 'Menu', width: 1.1 },
      { label: 'Ctrl', width: 1.1 },
    ],
  ],
  jis: [
    [
      { label: '半/全' },
      { label: '1' },
      { label: '2' },
      { label: '3' },
      { label: '4' },
      { label: '5' },
      { label: '6' },
      { label: '7' },
      { label: '8' },
      { label: '9' },
      { label: '0' },
      { label: '-' },
      { label: '^' },
      { label: '¥' },
      { label: '⌫', width: 1.5 },
    ],
    [
      { label: 'Tab', width: 1.2 },
      { label: 'Q' },
      { label: 'W' },
      { label: 'E' },
      { label: 'R' },
      { label: 'T' },
      { label: 'Y' },
      { label: 'U' },
      { label: 'I' },
      { label: 'O' },
      { label: 'P' },
      { label: '@' },
      { label: '[' },
      { label: '⏎', width: 1.6 },
    ],
    [
      { label: 'Caps', width: 1.3 },
      { label: 'A' },
      { label: 'S' },
      { label: 'D' },
      { label: 'F' },
      { label: 'G' },
      { label: 'H' },
      { label: 'J' },
      { label: 'K' },
      { label: 'L' },
      { label: ';' },
      { label: ':' },
      { label: ']', width: 1.3 },
    ],
    [
      { label: 'Shift', width: 1.8 },
      { label: 'Z' },
      { label: 'X' },
      { label: 'C' },
      { label: 'V' },
      { label: 'B' },
      { label: 'N' },
      { label: 'M' },
      { label: ',' },
      { label: '.' },
      { label: '/' },
      { label: 'Shift', width: 1.8 },
      { label: 'む', width: 1.1 },
    ],
    [
      { label: 'Ctrl', width: 1.1 },
      { label: '無変換', width: 1.3 },
      { label: 'Alt', width: 1.1 },
      { label: 'Space', width: 3.6 },
      { label: '変換', width: 1.3 },
      { label: 'Kana', width: 1.1 },
      { label: 'Ctrl', width: 1.1 },
    ],
  ],
}

function normaliseKeyLabel(label: string): string {
  if (label === '⌫' || label === 'Backspace') {
    return 'Backspace'
  }
  if (label === '⏎' || label === 'Enter') {
    return 'Enter'
  }
  if (label === 'Space') {
    return ' '
  }
  return label.toLowerCase()
}

function heatToColor(value: number): string {
  const clamped = Math.max(0, Math.min(value, 1))
  const hue = 200 - clamped * 140
  const saturation = 90
  const lightness = 90 - clamped * 55
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

export function Keyboard({ layout, nextKeys, pressedKeys, heatmap, onLayoutChange }: KeyboardProps) {
  const nextKeySet = useMemo(() => new Set(nextKeys.map(normaliseKeyLabel)), [nextKeys])
  const pressedKeySet = useMemo(() => new Set(pressedKeys.map(normaliseKeyLabel)), [pressedKeys])
  const resolvedLayout = layouts[layout]

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
      <header className="mb-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold uppercase tracking-wider">Virtual Keyboard</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">Layout</span>
          <div className="inline-flex overflow-hidden rounded-full border border-slate-300 dark:border-slate-600">
            {(['jis', 'us'] as KeyboardLayout[]).map((candidate) => (
              <button
                key={candidate}
                type="button"
                className={
                  'px-3 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ' +
                  (candidate === layout
                    ? 'bg-sky-500 text-white dark:bg-sky-400 dark:text-slate-900'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800')
                }
                onClick={() => onLayoutChange?.(candidate)}
              >
                {candidate.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        {resolvedLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map((key) => {
              const normalized = normaliseKeyLabel(key.label)
              const isNext = nextKeySet.has(normalized)
              const isPressed = pressedKeySet.has(normalized)
              const heatValue = heatmap?.[normalized] ?? 0
              return (
                <div
                  key={key.label + rowIndex}
                  className={
                    'relative flex items-center justify-center rounded-lg border text-[11px] font-medium uppercase text-slate-600 transition-colors duration-150 dark:text-slate-300 ' +
                    (isPressed
                      ? 'border-emerald-400 bg-emerald-100 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-600')
                  }
                  style={{
                    width: `${(key.width ?? 1) * 48}px`,
                    height: '44px',
                    background: isPressed
                      ? undefined
                      : isNext
                      ? 'linear-gradient(135deg, rgba(56,189,248,0.45), rgba(14,165,233,0.15))'
                      : heatValue > 0
                      ? heatToColor(heatValue)
                      : undefined,
                  }}
                  aria-label={key.label}
                >
                  <span
                    className={
                      (isNext ? 'animate-pulse ' : '') +
                      'px-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-200'
                    }
                  >
                    {key.label}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}
