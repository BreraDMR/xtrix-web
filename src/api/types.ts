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
export type BusinessUpdate = Schema<'BusinessUpdate'>
export type BusinessType = BusinessOut['business_type']
export type ClientLoyaltyBalance = Schema<'ClientLoyaltyBalance'>
export type ClientPage = Schema<'PaginatedResponse_ClientOut_'>
export type SalaryPaymentCreate = Schema<'SalaryPaymentCreate'>
export type ServiceOut = Schema<'ServiceOut'>
export type ServiceCreate = Schema<'ServiceCreate'>
export type ServicePage = Schema<'PaginatedResponse_ServiceOut_'>
export type ServiceSpecialistOut = Schema<'ServiceSpecialistOut'>
export type EmployeeOut = Schema<'EmployeeOut'>
export type UserPage = Schema<'PaginatedResponse_UserOut_'>
export type AssistantStatusOut = Schema<'AssistantStatusOut'>
export type AssistantPlanOut = Schema<'PlanOut'>
export type AssistantPlannedAction = AssistantPlanOut['actions'][number]
export type AssistantActionDisplay = Schema<'ActionDisplay'>
export type AssistantExecuteOut = Schema<'ExecuteOut'>
export type AssistantActionResult = Schema<'ActionResultOut'>
export type AssistantTranscribeOut = Schema<'TranscribeOut'>
export type ConversationOut = Schema<'ConversationOut'>
export type ConversationCreate = Schema<'ConversationCreate'>
export type ConversationRename = Schema<'ConversationRename'>
export type ConversationPage = Schema<'ConversationPage'>
export type MessageOut = Schema<'MessageOut'>
export type MessagePage = Schema<'MessagePage'>
