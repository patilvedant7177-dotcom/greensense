import type { ButtonHTMLAttributes } from 'react'

import { cn } from '../../lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  className,
  variant = 'default',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  const variants = {
    default:
      'bg-textPrimary text-bgPrimary hover:bg-textPrimary/90 disabled:bg-textMuted',
    secondary:
      'bg-accentGreen text-textPrimary hover:brightness-95 disabled:bg-textMuted',
    outline:
      'border border-border bg-bgPrimary text-textPrimary hover:bg-bgSurface disabled:text-textMuted',
    ghost: 'bg-transparent text-textMuted hover:bg-bgSurface hover:text-textPrimary',
  }

  const sizes = {
    sm: 'h-9 px-3 text-xs rounded-lg',
    md: 'h-11 px-4 text-sm rounded-xl',
    lg: 'h-14 px-8 text-base rounded-2xl',
  }

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

export default Button
