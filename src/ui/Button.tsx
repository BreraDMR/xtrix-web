import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger'
}

export default function Button({ variant = 'primary', className = '', type = 'button', ...props }: Props) {
  return <button type={type} className={`ui-button ui-button-${variant} ${className}`} {...props} />
}
