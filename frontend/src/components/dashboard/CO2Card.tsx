import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'
import type { AnalysisResult } from '../../types'

type CO2CardProps = {
  panelId: string
}

export function CO2Card({ panelId }: CO2CardProps) {
  const { data } = useQuery<AnalysisResult | null>({
    queryKey: ['latest-analysis', panelId],
    queryFn: async () => null,
    enabled: false,
    initialData: null,
  })

  if (!data) {
    return (
      <Card className="flex flex-col min-h-[180px]">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center pt-0 pb-6">
          <Skeleton className="h-14 w-24" />
        </CardContent>
      </Card>
    )
  }

  const currentCo2GramsPerHour = (data.p_actual_w / 1000) * 436
  // The backend's projected_today_co2_kg is generated dynamically from the current hour forward.
  // Therefore, it already represents the *remaining* estimated CO2 to be saved today!
  const remainingCo2SavedKg = Math.max(0, data.projected_today_co2_kg)

  return (
    <Card className="relative flex flex-col min-h-[180px] border-border bg-bgPrimary shadow-sm">
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-accentGreen/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Dynamic Glow Effect */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-32 bg-accentGreen/10 blur-3xl rounded-full pointer-events-none" />

      <CardHeader className="relative flex flex-row items-start justify-between gap-4 space-y-0 z-10">
        <div className="space-y-2">
          <CardTitle>Current CO2 Savings</CardTitle>
          <CardDescription>Based on current production.</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="relative flex-1 flex flex-col items-center justify-center pt-0 pb-6 z-10">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-6xl font-bold tracking-tight text-textPrimary drop-shadow-sm">
            {currentCo2GramsPerHour.toFixed(1)}
          </span>
          <span className="text-xl font-medium text-textMuted">
            g/h
          </span>
        </div>
        <div className="mt-4 px-3 py-1.5 rounded-full bg-border/40 border border-border/60 text-[11px] font-medium text-textMuted flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-accentGreen/80 animate-pulse" />
          Est. {remainingCo2SavedKg.toFixed(2)} kg remaining today
        </div>
      </CardContent>
    </Card>
  )
}

export default CO2Card
