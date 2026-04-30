import type { HTMLAttributes } from 'react'

import { cn } from '../../lib/utils'

const statusConfig = {
  normal: {
    label: 'Normal',
    className: 'bg-accentGreen/10 text-accentGreen border-accentGreen/20',
  },
  warning: {
    label: 'Warning',
    className: 'bg-amber/10 text-amber border-amber/20',
  },
  danger: {
    label: 'Danger',
    className: 'bg-danger/10 text-danger border-danger/20',
  },
  nighttime: {
    label: 'Nighttime',
    className: 'bg-textPrimary/8 text-textPrimary border-border',
  },
} as const

export type StatusBadgeStatus = keyof typeof statusConfig

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  status: StatusBadgeStatus
  label?: string
}

export function StatusBadge({
  status,
  label,
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
        config.className,
        className,
      )}
      {...props}
    >
      {label ?? config.label}
    </span>
  )
}

export default StatusBadge
