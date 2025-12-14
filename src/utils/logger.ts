/**
 * Утилита для логирования с сохранением в localStorage
 * Логи можно посмотреть в консоли: JSON.parse(localStorage.getItem('app_logs') || '[]')
 */

export const logger = {
  log: (message: string, data?: any) => {
    const timestamp = new Date().toISOString()
    const logMsg = data ? `[${timestamp}] ${message} ${JSON.stringify(data)}` : `[${timestamp}] ${message}`
    console.log(logMsg)
    
    if (typeof window !== 'undefined') {
      try {
        const logs = JSON.parse(localStorage.getItem('app_logs') || '[]')
        logs.push(logMsg)
        if (logs.length > 100) logs.shift() // Храним последние 100 логов
        localStorage.setItem('app_logs', JSON.stringify(logs))
      } catch (e) {
        // Игнорируем ошибки сохранения логов
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
        // Игнорируем ошибки
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

// Выводим команду для просмотра логов в консоли
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).viewLogs = () => {
    const logs = logger.getLogs()
    console.log('=== App Logs ===')
    logs.forEach((log: string) => console.log(log))
    console.log('===============')
  }
  console.log('💡 Для просмотра сохраненных логов выполните: viewLogs()')
}





