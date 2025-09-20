import { createBrowserRouter } from 'react-router-dom'

import App from './App.tsx'
import { HomePage } from './pages/Home.tsx'
import { PracticePage } from './pages/Practice.tsx'
import { SettingsPage } from './pages/Settings.tsx'
import { StatsPage } from './pages/Stats.tsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'practice',
        element: <PracticePage />,
      },
      {
        path: 'stats',
        element: <StatsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
])
