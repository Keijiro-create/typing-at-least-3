export type Locale = 'en' | 'ja'
export type TranslationParams = Record<string, string | number>

type Dictionary = Record<string, string>

type Dictionaries = Record<Locale, Dictionary>

const dictionaries: Dictionaries = {
  en: {
    'app.title': 'Typing Trainer',
    'import.helper': 'Drop .txt / .json files or choose manually.',
    'session.start': 'Start session',
    'session.resume': 'Resume practice',
    'settings.updated': 'Settings saved',
  },
  ja: {
    'app.title': 'タイピングトレーナー',
    'import.helper': '.txt / .json のファイルをドロップするか選択してください。',
    'session.start': '練習を開始',
    'session.resume': '練習を再開',
    'settings.updated': '設定を保存しました',
  },
}

let currentLocale: Locale = 'ja'

/**
 * Usage:
 * setLocale('en');
 * const label = t('session.start');
 */
export function setLocale(locale: Locale) {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}

export function t(key: string, params?: TranslationParams): string {
  const template = resolveTemplate(key)
  if (!params) {
    return template
  }

  return template.replace(/\{(.*?)\}/g, (match, token) => {
    const value = params[token.trim()]
    return value !== undefined ? String(value) : match
  })
}

function resolveTemplate(key: string): string {
  const localized = dictionaries[currentLocale]?.[key]
  if (localized) {
    return localized
  }

  const fallback = dictionaries.en[key]
  if (fallback) {
    return fallback
  }

  return key
}
