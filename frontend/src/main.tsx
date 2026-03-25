import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CurrencyProvider } from './hooks/useCurrency'
import { DarkModeProvider } from './hooks/useDarkMode'
import { AuthProvider } from './hooks/useAuth'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DarkModeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <App />
        </CurrencyProvider>
      </AuthProvider>
    </DarkModeProvider>
  </StrictMode>,
)
