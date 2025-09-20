import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AppProvider } from '../../context/AppContext'
import App from '../../App'

describe('Accessibility smoke check', () => {
  it('renders key ARIA landmarks and live regions on the practice page', () => {
    render(
      <AppProvider>
        <MemoryRouter initialEntries={['/practice']}>
          <App />
        </MemoryRouter>
      </AppProvider>,
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /practice field/i })).toBeInTheDocument()
    expect(document.querySelector('[aria-live="polite"]')).not.toBeNull()
  })
})
