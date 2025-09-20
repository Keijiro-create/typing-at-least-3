import { describe, expect, it, vi } from 'vitest'

import { createImeController } from '../ime'

describe('createImeController', () => {
  it('emits characters on insertText events', () => {
    const handler = vi.fn()
    const controller = createImeController({ onCharacter: handler })

    const event = new InputEvent('input', { data: 'a', inputType: 'insertText' })
    controller.handleInput?.(event as never)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('a', expect.objectContaining({ isIme: false }))
  })

  it('ignores insertCompositionText events and tracks composition state', () => {
    const handler = vi.fn()
    const controller = createImeController({ onCharacter: handler })

    const beforeEvent = new InputEvent('beforeinput', { data: 'あ', inputType: 'insertCompositionText' })
    controller.handleBeforeInput?.(beforeEvent as never)
    expect(handler).not.toHaveBeenCalled()

    controller.handleCompositionStart?.(new CompositionEvent('compositionstart'))

    const inputEvent = new InputEvent('input', { data: 'あ', inputType: 'insertText' })
    controller.handleInput?.(inputEvent as never)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][1].isIme).toBe(true)

    controller.handleCompositionEnd?.(new CompositionEvent('compositionend'))
    controller.reset()

    const followUpEvent = new InputEvent('input', { data: 'b', inputType: 'insertText' })
    controller.handleInput?.(followUpEvent as never)

    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler.mock.calls[1][1].isIme).toBe(false)
  })
})
