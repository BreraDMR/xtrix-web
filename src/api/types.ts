import type { components } from './schema'

// Shapes from the API contract (openapi.json in xtrix-api), regenerate with `npm run gen:api`.
// Use these instead of hand-written interfaces so a backend change shows up in tsc.
export type Schema<K extends keyof components['schemas']> = components['schemas'][K]

export type ClientOut = Schema<'ClientOut'>
export type ClientCreate = Schema<'ClientCreate'>
export type ClientUpdate = Schema<'ClientUpdate'>
export type ClientLanguage = ClientOut['language']
export type UserOut = Schema<'UserOut'>
export type UserRole = UserOut['role']
export type UserPreferencesOut = Schema<'UserPreferencesOut'>
export type UserPreferencesUpdate = Schema<'UserPreferencesUpdate'>
export type VisitOut = Schema<'VisitOut'>
export type BusinessOut = Schema<'BusinessOut'>
export type BusinessType = BusinessOut['business_type']
