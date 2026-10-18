// drop '' and undefined so the API gets "not sent" instead of an empty value
export function withoutBlanks<T extends object>(data: T): Partial<T> {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== '' && value !== undefined)) as Partial<T>
}
