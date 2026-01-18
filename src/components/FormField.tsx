import { ReactNode } from 'react'
import FormError from './FormError'
import { HiQuestionMarkCircle } from 'react-icons/hi'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export default function FormField({ 
  label, 
  required = false, 
  error, 
  hint, 
  children, 
  className = '' 
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && (
          <span className="ml-2 text-gray-400 group relative">
            <HiQuestionMarkCircle className="w-4 h-4 inline cursor-help" />
            <span className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {hint}
            </span>
          </span>
        )}
      </label>
      {children}
      {error && <FormError message={error} />}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  )
}
