import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// Set initial document language
if (typeof window !== 'undefined') {
  const savedLocale = localStorage.getItem('xtrix-locale')
  if (savedLocale && (savedLocale === 'en' || savedLocale === 'ru' || savedLocale === 'cz')) {
    document.documentElement.lang = savedLocale
  } else {
    const browserLang = navigator.language.toLowerCase()
    let locale = 'en'
    if (browserLang.startsWith('ru')) locale = 'ru'
    else if (browserLang.startsWith('cs') || browserLang.startsWith('cz')) locale = 'cz'
    document.documentElement.lang = locale
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)











