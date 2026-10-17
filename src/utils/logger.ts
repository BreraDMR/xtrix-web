export const logger = {
  log: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) console.log(message, data)
  },
  error: (message: string, error?: unknown) => {
    if (import.meta.env.DEV) console.error(message, error)
  },
}
