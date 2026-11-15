import { LuCircleX } from 'react-icons/lu'

interface FormErrorProps {
  message: string
  className?: string
}

export default function FormError({ message, className = '' }: FormErrorProps) {
  if (!message) return null
  
  return (
    <div className={`flex items-center gap-2 text-red-600 text-sm mt-1 ${className}`}>
      <LuCircleX className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}
