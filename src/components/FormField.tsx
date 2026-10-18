import { ReactElement, ReactNode, cloneElement, isValidElement, useId } from 'react'
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
  // tie the label to the control, so the field can be found by its label
  const generatedId = useId()
  const control = isValidElement(children) ? (children as ReactElement<{ id?: string; 'aria-invalid'?: boolean }>) : null
  const controlId = control?.props.id ?? generatedId

  return (
    <div className={className}>
      <label htmlFor={control ? controlId : undefined} className="block text-sm font-medium mb-1">
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
      {control ? cloneElement(control, { id: controlId, 'aria-invalid': error ? true : undefined }) : children}
      {error && <FormError message={error} />}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  )
}
