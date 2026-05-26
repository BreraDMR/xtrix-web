

export const logger = {
  log: (message: string, data?: any) => {
    const timestamp = new Date().toISOString()
    const logMsg = data ? `[${timestamp}] ${message} ${JSON.stringify(data)}` : `[${timestamp}] ${message}`
    console.log(logMsg)
    
    if (typeof window !== 'undefined') {
      try {
        const logs = JSON.parse(localStorage.getItem('app_logs') || '[]')
        logs.push(logMsg)
        if (logs.length > 100) logs.shift()
        localStorage.setItem('app_logs', JSON.stringify(logs))
      } catch (e) {
      }
    }
  },
  
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString()
    const logMsg = error ? `[${timestamp}] ERROR: ${message} ${error.toString()}` : `[${timestamp}] ERROR: ${message}`
    console.error(logMsg)
    
    if (typeof window !== 'undefined') {
      try {
        const logs = JSON.parse(localStorage.getItem('app_logs') || '[]')
        logs.push(logMsg)
        if (logs.length > 100) logs.shift()
        localStorage.setItem('app_logs', JSON.stringify(logs))
      } catch (e) {
      }
    }
  },
  
  getLogs: (): string[] => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('app_logs') || '[]')
      } catch {
        return []
      }
    }
    return []
  },
  
  clearLogs: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app_logs')
    }
  }
}

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).viewLogs = () => {
    const logs = logger.getLogs()
    console.log('=== App Logs ===')
    logs.forEach((log: string) => console.log(log))
    console.log('===============')
  }
  console.log('💡 Для просмотра сохраненных логов выполните: viewLogs()')
}


