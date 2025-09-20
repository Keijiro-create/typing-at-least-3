import type { SessionMetrics, TrainerSettings, WeakKeyStat } from '../types'

export type ProgressState = {
  completedLessonIds: string[]
  weakKeys: WeakKeyStat[]
  lastSyncedAt?: string
}

export type StorageShape = {
  schemaVersion: number
  settings: TrainerSettings
  progress: ProgressState
  sessions: SessionMetrics[]
}

type Migration = {
  from: number
  to: number
  migrate: (data: unknown) => StorageShape
}

const STORAGE_KEY = 'typing.v1'
const CURRENT_SCHEMA_VERSION = 1

const migrations: Migration[] = []

const defaultSettings: TrainerSettings = {
  theme: 'system',
  sound: true,
  autoStart: false,
  language: 'ja',
  highlightWeakKeys: true,
  preferredLessonId: undefined,
  keyboardLayout: 'jis',
  sprintGoalWpm: 55,
  reducedMotion: undefined,
}

const defaultProgress: ProgressState = {
  completedLessonIds: [],
  weakKeys: [],
  lastSyncedAt: undefined,
}

const defaultStorage: StorageShape = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  settings: defaultSettings,
  progress: defaultProgress,
  sessions: [],
}

/**
 * Usage:
 * const storage = loadStorage();
 * saveStorage({ ...storage, settings: { ...storage.settings, theme: 'dark' } });
 */
export function loadStorage(): StorageShape {
  if (typeof window === 'undefined') {
    return cloneStorage(defaultStorage)
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return cloneStorage(defaultStorage)
    }

    const parsed = JSON.parse(raw) as Partial<StorageShape & { schemaVersion?: number }>
    const migrated = applyMigrations(parsed)
    return sanitizeStorage(migrated)
  } catch (error) {
    console.warn('[storage] Failed to load, falling back to defaults.', error)
    return cloneStorage(defaultStorage)
  }
}

export function saveStorage(value: StorageShape) {
  if (typeof window === 'undefined') {
    return
  }

  const payload = JSON.stringify(value)
  window.localStorage.setItem(STORAGE_KEY, payload)
}

export function updateStorage(updater: (value: StorageShape) => StorageShape) {
  const current = loadStorage()
  const next = updater(current)
  saveStorage(next)
}

export function registerMigration(migration: Migration) {
  migrations.push(migration)
  migrations.sort((a, b) => a.from - b.from)
}

function applyMigrations(parsed: Partial<StorageShape> & { schemaVersion?: number }): StorageShape {
  let snapshot: StorageShape = sanitizeStorage(parsed)

  while (snapshot.schemaVersion < CURRENT_SCHEMA_VERSION) {
    const migration = migrations.find((item) => item.from === snapshot.schemaVersion)
    if (!migration) {
      snapshot = { ...cloneStorage(defaultStorage), settings: snapshot.settings }
      break
    }
    snapshot = migration.migrate(snapshot)
  }

  return snapshot
}

function sanitizeStorage(parsed: Partial<StorageShape> & { schemaVersion?: number }): StorageShape {
  const schemaVersion = parsed.schemaVersion ?? 0
  const settings = parsed.settings ?? defaultSettings
  const progress = parsed.progress ?? defaultProgress
  const sessions = parsed.sessions ?? []

  return {
    schemaVersion: schemaVersion >= 0 ? schemaVersion : 0,
    settings: {
      theme: settings.theme ?? defaultSettings.theme,
      sound: settings.sound ?? defaultSettings.sound,
      autoStart: settings.autoStart ?? defaultSettings.autoStart,
      language: settings.language ?? defaultSettings.language,
      highlightWeakKeys: settings.highlightWeakKeys ?? defaultSettings.highlightWeakKeys,
      preferredLessonId: settings.preferredLessonId,
      keyboardLayout: settings.keyboardLayout ?? defaultSettings.keyboardLayout,
      sprintGoalWpm: normalizeSprintGoal(settings.sprintGoalWpm),
      reducedMotion: settings.reducedMotion,
    },
    progress: {
      completedLessonIds: [...new Set(progress.completedLessonIds ?? [])],
      weakKeys: (progress.weakKeys ?? []).map((item) => ({ ...item })),
      lastSyncedAt: progress.lastSyncedAt,
    },
    sessions: sessions.map((session) => ({ ...session })).slice(-200),
  }
}

function cloneStorage(input: StorageShape): StorageShape {
  return {
    schemaVersion: input.schemaVersion,
    settings: { ...input.settings },
    progress: {
      completedLessonIds: [...input.progress.completedLessonIds],
      weakKeys: input.progress.weakKeys.map((key) => ({ ...key })),
      lastSyncedAt: input.progress.lastSyncedAt,
    },
    sessions: input.sessions.map((session) => ({ ...session })),
  }
}

function normalizeSprintGoal(goal: number | undefined): number {
  if (!Number.isFinite(goal)) {
    return defaultSettings.sprintGoalWpm
  }
  return Math.max(10, Math.min(220, Math.round(goal)))
}

export const STORAGE_SCHEMA_VERSION = CURRENT_SCHEMA_VERSION
export const STORAGE_KEY_NAME = STORAGE_KEY
export const DEFAULT_SETTINGS = defaultSettings
