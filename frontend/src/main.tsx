import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './hooks/useAuth'
import { CurrencyProvider } from './hooks/useCurrency'
import { DarkModeProvider } from './hooks/useDarkMode'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DarkModeProvider>
        <CurrencyProvider>
          <App />
        </CurrencyProvider>
      </DarkModeProvider>
    </AuthProvider>
  </StrictMode>,
)
