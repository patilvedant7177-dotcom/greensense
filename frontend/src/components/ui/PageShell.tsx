import type { PropsWithChildren, ReactNode } from 'react'

import { cn } from '../../lib/utils'

type PageShellProps = PropsWithChildren<{
  appName: string
  sidebar?: ReactNode
  topNavSlot?: ReactNode
  className?: string
}>

export function PageShell({
  appName,
  sidebar,
  topNavSlot,
  className,
  children,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-bgSurface text-textPrimary">
      <header className="sticky top-0 z-50 border-b border-border bg-bgPrimary/80 backdrop-blur-md">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-8">
          <div className="group flex items-baseline gap-2">
            <span className="text-2xl font-black uppercase tracking-tighter text-accentGreen">
              GreenSense
            </span>
            <div className="h-6 w-[2px] rotate-[20deg] bg-border mx-2" />
            <h1 className="text-xl font-medium tracking-tight text-textPrimary/80">
              {appName}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            {topNavSlot}
          </div>
        </div>
      </header>

      <div
        className={cn(
          "mx-auto min-h-[calc(100vh-4rem)] max-w-7xl gap-6 px-6 py-6",
          sidebar ? "grid lg:grid-cols-[240px_minmax(0,1fr)]" : "block"
        )}
      >
        {sidebar && (
          <aside className="rounded-3xl border border-dashed border-border bg-bgPrimary p-4">
            {sidebar}
          </aside>
        )}

        <main
          className={cn(
            'rounded-3xl border border-border bg-bgPrimary p-6 shadow-sm min-h-[70vh]',
            className,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default PageShell
