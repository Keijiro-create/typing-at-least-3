import { describe, expect, it, vi } from 'vitest'

import { createIMEHandlers } from '../ime'

describe('createIMEHandlers', () => {
  it('triggers onConfirm with the full confirmed string on insertText', () => {
    const onConfirm = vi.fn()
    const handlers = createIMEHandlers({ onConfirm })

    const event = {
      inputType: 'insertText',
      data: 'かな',
      preventDefault: vi.fn(),
    } as unknown as InputEvent

    handlers.onBeforeInput(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledWith('かな')
  })

  it('ignores insertCompositionText and handles deleteContentBackward', () => {
    const onConfirm = vi.fn()
    const onBackspace = vi.fn()
    const handlers = createIMEHandlers({ onConfirm, onBackspace })

    const compEvent = {
      inputType: 'insertCompositionText',
      data: 'あ',
      preventDefault: vi.fn(),
    } as unknown as InputEvent

    handlers.onBeforeInput(compEvent)
    expect(onConfirm).not.toHaveBeenCalled()
    expect(compEvent.preventDefault).not.toHaveBeenCalled()

    const deleteEvent = {
      inputType: 'deleteContentBackward',
      data: null,
      preventDefault: vi.fn(),
    } as unknown as InputEvent

    handlers.onBeforeInput(deleteEvent)
    expect(deleteEvent.preventDefault).toHaveBeenCalled()
    expect(onBackspace).toHaveBeenCalledTimes(1)
  })

  it('handles physical backspace when not composing', () => {
    const onBackspace = vi.fn()
    const handlers = createIMEHandlers({ onConfirm: () => {}, onBackspace })

    const keyEvent = {
      key: 'Backspace',
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent

    handlers.onKeyDown(keyEvent)
    expect(keyEvent.preventDefault).toHaveBeenCalled()
    expect(onBackspace).toHaveBeenCalled()
  })
})
