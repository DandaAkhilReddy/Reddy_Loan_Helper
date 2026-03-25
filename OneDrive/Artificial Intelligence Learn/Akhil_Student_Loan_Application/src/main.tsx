import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CurrencyProvider } from './hooks/useCurrency'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </StrictMode>,
)
