export type LessonStage = {
  id: string
  title: string
  description: string
  lines: string[]
}

export type Lesson = {
  id: string
  language: 'en' | 'ja'
  title: string
  summary: string
  stages: LessonStage[]
  tags?: string[]
}

export type PhraseList = {
  id: string
  language: 'en' | 'ja'
  title: string
  description: string
  phrases: string[]
}

export type SessionMetrics = {
  sessionId: string
  lessonId?: string
  phraseListId?: string
  startedAt: string
  completedAt?: string
  durationMs: number
  grossWpm: number
  netWpm: number
  accuracy: number
  totalKeystrokes: number
  errorCount: number
  weakKeys: WeakKeyStat[]
}

export type WeakKeyStat = {
  key: string
  missCount: number
  accuracy: number
  streak: number
  lastPracticedAt?: string
}

export type Settings = {
  theme: 'system' | 'light' | 'dark'
  sound: boolean
  autoStart: boolean
  language: 'ja' | 'en'
  highlightWeakKeys: boolean
  preferredLessonId?: string
}
export type KeyboardLayout = 'jis' | 'us'

export type SettingsAugmentation = {
  keyboardLayout: KeyboardLayout
  sprintGoalWpm: number
  reducedMotion?: boolean
}

export type TrainerSettings = Settings & SettingsAugmentation

export type MetricSnapshot = {
  timestamp: string
  wpm: number
  cpm: number
  kpm: number
  accuracy: number
  errors: number
  combo: number
}

export type SprintSetResult = {
  setIndex: number
  startedAt: string
  endedAt: string
  metrics: MetricSnapshot
  weakKeys: WeakKeyStat[]
}

export type SessionPlan = {
  setLengthMs: number
  setCount: number
}
