import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
// Inter ships with the app; no request to Google Fonts on any page
import '@fontsource-variable/inter/opsz.css'
import './index.css'
import './ui/theme.css'
import { applyTheme, savedTheme } from './utils/theme'
import { bindSessionCache } from './api/sessionCache'
import { bindVisitorCache } from './api/visitorClient'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

bindSessionCache(queryClient)
bindVisitorCache(queryClient)

applyTheme(savedTheme())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)


