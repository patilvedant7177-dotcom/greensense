import type { InputHTMLAttributes } from 'react'

import { cn } from '../../lib/utils'

export function Input({ className, type = 'text', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-border bg-bgPrimary px-3 text-sm text-textPrimary outline-none transition focus:border-textPrimary placeholder:text-textMuted/70',
        className,
      )}
      {...props}
    />
  )
}

export default Input
