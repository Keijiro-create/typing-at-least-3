import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { Dispatch, ReactNode } from 'react'

import type {
  MetricSnapshot,
  SessionMetrics,
  TrainerSettings,
  WeakKeyStat,
} from '../types'
import {
  DEFAULT_SETTINGS,
  STORAGE_KEY_NAME,
  STORAGE_SCHEMA_VERSION,
  loadStorage,
  saveStorage,
  type ProgressState,
  type StorageShape,
} from '../lib/storage'

export type TypingSessionState = {
  sessionId: string
  lessonId?: string
  phraseListId?: string
  startedAt: string
  confirmedCharCount: number
  totalKeystrokes: number
  errorCount: number
  combo: number
  maxCombo: number
  lastInputAt?: string
  snapshots: MetricSnapshot[]
  weakKeys: WeakKeyStat[]
}

export type AppState = {
  settings: TrainerSettings
  progress: ProgressState
  session: TypingSessionState | null
  sessions: SessionMetrics[]
}

export type AppAction =
  | { type: 'settings/replace'; payload: TrainerSettings }
  | { type: 'settings/update'; payload: Partial<TrainerSettings> }
  | { type: 'session/start'; payload: { sessionId: string; lessonId?: string; phraseListId?: string; startedAt?: string } }
  | { type: 'session/record'; payload: { confirmedCharDelta?: number; keystrokeDelta?: number; errorDelta?: number; combo?: number; snapshot?: MetricSnapshot; weakKeys?: readonly WeakKeyStat[]; lastInputAt?: string } }
  | { type: 'session/end'; payload: SessionMetrics }
  | { type: 'session/reset' }
  | { type: 'progress/set'; payload: ProgressState }
  | { type: 'progress/mergeWeakKeys'; payload: readonly WeakKeyStat[] }
  | { type: 'sessions/replace'; payload: SessionMetrics[] }
  | { type: 'storage/clear' }

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> } | undefined>(undefined)

const STORAGE_CAP = 200

const initialSnapshot: StorageShape = loadStorage()

const initialState: AppState = {
  settings: initialSnapshot.settings,
  progress: initialSnapshot.progress,
  session: null,
  sessions: initialSnapshot.sessions,
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'settings/replace':
      return { ...state, settings: { ...DEFAULT_SETTINGS, ...action.payload } }
    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.payload } }
    case 'session/start': {
      const startedAt = action.payload.startedAt ?? new Date().toISOString()
      const nextSession: TypingSessionState = {
        sessionId: action.payload.sessionId,
        lessonId: action.payload.lessonId,
        phraseListId: action.payload.phraseListId,
        startedAt,
        confirmedCharCount: 0,
        totalKeystrokes: 0,
        errorCount: 0,
        combo: 0,
        maxCombo: 0,
        lastInputAt: undefined,
        snapshots: [],
        weakKeys: [],
      }
      return { ...state, session: nextSession }
    }
    case 'session/record': {
      if (!state.session) {
        return state
      }

      const combo = action.payload.combo ?? state.session.combo
      const maxCombo = Math.max(state.session.maxCombo, combo)
      const updatedSnapshots = action.payload.snapshot
        ? [...state.session.snapshots, action.payload.snapshot]
        : state.session.snapshots
      const updatedWeakKeys = action.payload.weakKeys
        ? mergeWeakKeys(state.session.weakKeys, action.payload.weakKeys)
        : state.session.weakKeys

      return {
        ...state,
        session: {
          ...state.session,
          confirmedCharCount:
            state.session.confirmedCharCount + (action.payload.confirmedCharDelta ?? 0),
          totalKeystrokes:
            state.session.totalKeystrokes + (action.payload.keystrokeDelta ?? 0),
          errorCount: state.session.errorCount + (action.payload.errorDelta ?? 0),
          combo,
          maxCombo,
          lastInputAt: action.payload.lastInputAt ?? state.session.lastInputAt,
          snapshots: updatedSnapshots,
          weakKeys: updatedWeakKeys,
        },
      }
    }
    case 'session/end': {
      const cappedSessions = [...state.sessions, action.payload].slice(-STORAGE_CAP)

      return {
        ...state,
        session: null,
        sessions: cappedSessions,
      }
    }
    case 'session/reset':
      return { ...state, session: null }
    case 'progress/set':
      return { ...state, progress: { ...action.payload } }
    case 'progress/mergeWeakKeys': {
      const merged = mergeWeakKeys(state.progress.weakKeys, action.payload)
      return {
        ...state,
        progress: {
          ...state.progress,
          weakKeys: merged,
        },
      }
    }
    case 'sessions/replace':
      return { ...state, sessions: action.payload.slice(-STORAGE_CAP) }
    case 'storage/clear':
      return {
        ...state,
        progress: { ...initialSnapshot.progress },
        sessions: [],
      }
    default:
      return state
  }
}

function mergeWeakKeys(current: readonly WeakKeyStat[], updates: readonly WeakKeyStat[]): WeakKeyStat[] {
  const map = new Map<string, WeakKeyStat>()
  for (const item of current) {
    map.set(item.key, { ...item })
  }
  for (const item of updates) {
    const existing = map.get(item.key)
    if (!existing) {
      map.set(item.key, { ...item })
      continue
    }
    map.set(item.key, {
      ...existing,
      missCount: item.missCount,
      accuracy: item.accuracy,
      streak: item.streak,
      lastPracticedAt: item.lastPracticedAt ?? existing.lastPracticedAt,
    })
  }
  return Array.from(map.values()).sort((a, b) => (b.missCount - a.missCount) || a.key.localeCompare(b.key))
}

/**
 * Usage:
 * const { state, dispatch } = useAppContext();
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    saveStorage({
      schemaVersion: STORAGE_SCHEMA_VERSION,
      settings: state.settings,
      progress: state.progress,
      sessions: state.sessions,
    })
  }, [state.settings, state.progress, state.sessions])

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

export function useStorageExport() {
  const { state } = useAppContext()
  return useMemo(
    () =>
      JSON.stringify(
        {
          schemaVersion: STORAGE_SCHEMA_VERSION,
          exportedAt: new Date().toISOString(),
          key: STORAGE_KEY_NAME,
          settings: state.settings,
          progress: state.progress,
          sessions: state.sessions,
        },
        null,
        2,
      ),
    [state.progress, state.sessions, state.settings],
  )
}
