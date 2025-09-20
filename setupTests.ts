import '@testing-library/jest-dom'

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!('ResizeObserver' in globalThis)) {
  ;(globalThis as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver = MockResizeObserver
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: query.includes('prefers-color-scheme: dark'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})
