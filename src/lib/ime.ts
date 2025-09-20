import type { InputHTMLAttributes } from 'react'

export type ConfirmedCharacterHandler = (
  char: string,
  context: { event: InputEvent; isIme: boolean },
) => void

export type ImeControllerOptions = {
  onCharacter: ConfirmedCharacterHandler
  onCompositionStart?: () => void
  onCompositionEnd?: () => void
}

type ImeState = {
  composing: boolean
}

const DEFAULT_STATE: ImeState = {
  composing: false,
}

const INSERT_COMPOSITION_TEXT = 'insertCompositionText'
const INSERT_TEXT = 'insertText'

/**
 * Usage:
 * const ime = createImeController({ onCharacter: handleChar });
 * <input
 *   onCompositionStart={ime.handleCompositionStart}
 *   onCompositionEnd={ime.handleCompositionEnd}
 *   onBeforeInput={ime.handleBeforeInput}
 *   onInput={ime.handleInput}
 * />
 */
export function createImeController(options: ImeControllerOptions) {
  const state: ImeState = { ...DEFAULT_STATE }

  const emitCharacters = (event: InputEvent) => {
    const data = event.data ?? ''
    if (!data) {
      return
    }

    const isIme = state.composing || event.isComposing

    for (const char of Array.from(data)) {
      options.onCharacter(char, { event, isIme })
    }
  }

  const handleCompositionStart: InputHTMLAttributes<HTMLInputElement>['onCompositionStart'] = () => {
    state.composing = true
    options.onCompositionStart?.()
  }

  const handleCompositionEnd: InputHTMLAttributes<HTMLInputElement>['onCompositionEnd'] = () => {
    state.composing = false
    options.onCompositionEnd?.()
  }

  const handleBeforeInput: InputHTMLAttributes<HTMLInputElement>['onBeforeInput'] = (syntheticEvent) => {
    const event = extractInputEvent(syntheticEvent)
    if (!event) {
      return
    }

    if (event.inputType === INSERT_COMPOSITION_TEXT) {
      return
    }
  }

  const handleInput: InputHTMLAttributes<HTMLInputElement>['onInput'] = (syntheticEvent) => {
    const event = extractInputEvent(syntheticEvent)
    if (!event || event.inputType !== INSERT_TEXT) {
      return
    }

    emitCharacters(event)
  }

  const reset = () => {
    state.composing = false
  }

  return {
    handleCompositionStart,
    handleCompositionEnd,
    handleBeforeInput,
    handleInput,
    reset,
  }
}

export function createImeDomBinder(options: ImeControllerOptions) {
  const controller = createImeController(options)

  const compositionStart = (event: CompositionEvent) => {
    controller.handleCompositionStart?.(event as never)
  }
  const compositionEnd = (event: CompositionEvent) => {
    controller.handleCompositionEnd?.(event as never)
  }
  const beforeInput = (event: InputEvent) => {
    controller.handleBeforeInput?.(event as never)
  }
  const input = (event: InputEvent) => {
    controller.handleInput?.(event as never)
  }

  return {
    attach(target: HTMLElement) {
      target.addEventListener('compositionstart', compositionStart)
      target.addEventListener('compositionend', compositionEnd)
      target.addEventListener('beforeinput', beforeInput as EventListener)
      target.addEventListener('input', input as EventListener)
    },
    detach(target: HTMLElement) {
      target.removeEventListener('compositionstart', compositionStart)
      target.removeEventListener('compositionend', compositionEnd)
      target.removeEventListener('beforeinput', beforeInput as EventListener)
      target.removeEventListener('input', input as EventListener)
    },
    reset: controller.reset,
  }
}

function extractInputEvent(event: unknown): InputEvent | null {
  if (event instanceof InputEvent) {
    return event
  }

  if (typeof event === 'object' && event !== null) {
    const candidate = event as { nativeEvent?: InputEvent }
    if (candidate.nativeEvent instanceof InputEvent) {
      return candidate.nativeEvent
    }
  }

  return null
}
