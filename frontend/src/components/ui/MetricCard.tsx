import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '../../lib/utils'

type MetricCardProps = HTMLAttributes<HTMLDivElement> & {
  title: string
  value: string | number
  unit?: string
  statusColorClassName?: string
  statusDot?: ReactNode
}

export function MetricCard({
  title,
  value,
  unit,
  statusColorClassName = 'bg-accentGreen',
  statusDot,
  className,
  children,
  ...props
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'card-hover rounded-[32px] border border-border bg-bgPrimary p-5 shadow-sm',
        className,
      )}
      {...props}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-lg font-bold text-textMuted">{title}</p>
        {statusDot === undefined ? (
          <span
            aria-hidden="true"
            className={cn(
              'h-2.5 w-2.5 rounded-full border border-bgPrimary',
              statusColorClassName,
            )}
          />
        ) : (
          statusDot
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-semibold tracking-tight text-textPrimary">
          {value}
        </span>
        {unit ? (
          <span className="pb-1 text-sm font-medium text-textMuted">{unit}</span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

export default MetricCard
