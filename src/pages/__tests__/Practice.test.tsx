import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AppProvider } from '../../context/AppContext'
import { PracticePage, PRACTICE_STRINGS } from '../Practice'

function renderWithProviders() {
  return render(
    <AppProvider>
      <MemoryRouter>
        <PracticePage />
      </MemoryRouter>
    </AppProvider>,
  )
}

describe('PracticePage flow', () => {
  it('runs a sprint, handles backspace without penalty, and shows the result modal', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    const practiceRegion = screen.getByRole('region', { name: /practice field/i })
    await user.click(practiceRegion)

    await user.keyboard('t')
    await user.keyboard('{Backspace}')

    const target = PRACTICE_STRINGS[0]
    for (const char of target.slice(1)) {
      if (char === '\n') {
        await user.keyboard('[Enter]')
      } else {
        await user.keyboard(char)
      }
    }

    const resultHeading = await screen.findByText(/Sprint Summary/i)
    expect(resultHeading).toBeInTheDocument()

    const errorsLabel = screen.getAllByText('Errors')[0]
    expect(errorsLabel.nextElementSibling?.textContent).toMatch(/^0/) // remains unpenalised
  }, 15000)
})
