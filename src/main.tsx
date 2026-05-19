import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { runSystemCheck, logSystemCheckResults } from './lib/systemCheck'

// Run system check on startup
const systemCheck = runSystemCheck()
logSystemCheckResults(systemCheck)

if (systemCheck.overall === 'error') {
  console.error('🚨 Critical system errors detected. Please fix before running.')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
