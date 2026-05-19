import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from './lib/supabase'

// Debug: verify Supabase initialization
console.log('=== SUPABASE CLIENT INIT ===')
console.log('URL:', supabase.supabaseUrl)
console.log('Key starts with:', supabase.supabaseKey?.substring(0, 20) + '...')

supabase.auth.getSession().then(({ data, error }) => {
  console.log('Initial getSession completed:', {
    hasSession: !!data.session,
    error: error?.message || 'none'
  })
}).catch(e => {
  console.error('getSession threw error:', e?.message || e)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
