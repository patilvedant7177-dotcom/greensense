import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'

import CO2Card from '../components/dashboard/CO2Card'
import EfficiencyGauge from '../components/dashboard/EfficiencyGauge'
import ForecastChart from '../components/dashboard/ForecastChart'
import PerformanceChart from '../components/dashboard/PerformanceChart'
import TelemetryForm from '../components/dashboard/TelemetryForm'
import FaultPanel from '../components/dashboard/FaultPanel'
import SuggestionsPanel from '../components/dashboard/SuggestionsPanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { PageShell } from '../components/ui/PageShell'
import { Skeleton } from '../components/ui/Skeleton'
import { usePanel } from '../hooks/usePanel'
import useRealtimeReadings from '../hooks/useRealtimeReadings'
import type { AnalysisResult } from '../types'

function Dashboard() {
  const { panelId = '' } = useParams()
  const panelQuery = usePanel(panelId)
  useRealtimeReadings(panelId)
  const latestAnalysisQuery = useQuery<AnalysisResult | null>({
    queryKey: ['latest-analysis', panelId],
    queryFn: async () => null,
    enabled: false,
    initialData: null,
  })

  return (
    <PageShell
      appName="Control Center"
      topNavSlot={
        <Link
          to="/config"
          className="flex items-center gap-2 rounded-full border border-border bg-bgSurface px-5 py-2.5 text-sm font-semibold text-textPrimary transition-all hover:bg-bgPrimary hover:border-accent shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Reconfigure Twin
        </Link>
      }
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-1 border-l-4 border-accent pl-6 py-2">
          <h2 className="text-4xl font-black tracking-tight text-textPrimary uppercase">
            {panelQuery.data?.name ?? 'Loading performance...'}
          </h2>
          <p className="text-sm font-medium text-textMuted">
            GEO-COORDINATES: {panelQuery.data?.latitude?.toFixed(4)}°N, {panelQuery.data?.longitude?.toFixed(4)}°E
          </p>
        </div>

        {panelQuery.isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[260px] w-full rounded-[28px]" />
            <Skeleton className="h-[260px] w-full rounded-[28px]" />
            <Skeleton className="h-[340px] w-full rounded-[28px]" />
            <Skeleton className="h-[340px] w-full rounded-[28px]" />
          </div>
        ) : !panelQuery.data ? (
          <Card>
            <CardHeader>
              <CardTitle>Panel not found</CardTitle>
              <CardDescription>
                The requested panel could not be loaded from Supabase.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column: Input and Config Stack */}
            <div className="space-y-6">
              <TelemetryForm panelId={panelId} />
              <Card>
                <CardHeader className="pb-3 border-b border-border/40 mb-4 bg-bgSurface/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Module Configurations</CardTitle>
                      <CardDescription className="text-[10px]">Saved Panel specs</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] text-textMuted uppercase font-bold mb-1">Max Power</p>
                    <p className="text-sm font-semibold text-textPrimary">{panelQuery.data.p_max_w}W</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-textMuted uppercase font-bold mb-1">Max Voltage / Max Current</p>
                    <p className="text-sm font-semibold text-textPrimary">{panelQuery.data.v_mp}V / {panelQuery.data.i_mp}A</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-textMuted uppercase font-bold mb-1">Area</p>
                    <p className="text-sm font-semibold text-textPrimary">{panelQuery.data.area_m2} m²</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Key Analytics */}
            <EfficiencyGauge analysis={latestAnalysisQuery.data} />

            {/* Row 2: Fault Analysis (Full width) */}
            {latestAnalysisQuery.data && (
              <div className="lg:col-span-2">
                <FaultPanel
                  panelId={panelId}
                  fault_code={latestAnalysisQuery.data.fault_code}
                  fault_confidence={latestAnalysisQuery.data.fault_confidence}
                  recommendation={latestAnalysisQuery.data.recommendation}
                  voltage_drop_pct={latestAnalysisQuery.data.voltage_drop_pct}
                  current_drop_pct={latestAnalysisQuery.data.current_drop_pct}
                  reasons={latestAnalysisQuery.data.fault_reasons}
                />
              </div>
            )}

            {/* Row 3: Suggestions (Full width) */}
            {latestAnalysisQuery.data && (latestAnalysisQuery.data.suggestions?.length ?? 0) > 0 && (
              <div className="lg:col-span-2">
                <SuggestionsPanel suggestions={latestAnalysisQuery.data.suggestions} />
              </div>
            )}

            {/* Row 4: Historical Data and Impact */}
            <PerformanceChart panelId={panelId} />
            <CO2Card panelId={panelId} />

            {/* Row 5: Forecast */}
            <div className="lg:col-span-2">
              <ForecastChart panelId={panelId} />
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}

export default Dashboard
