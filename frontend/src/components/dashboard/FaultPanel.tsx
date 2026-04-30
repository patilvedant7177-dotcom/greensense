import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'
import { Skeleton } from '../ui/Skeleton'
import type { CorrelationResult } from '../../types'

const API_URL = import.meta.env.VITE_API_URL || ''

type FaultPanelProps = {
  panelId: string
  fault_code: string
  fault_confidence: number
  recommendation: string
  voltage_drop_pct: number | null
  current_drop_pct: number | null
  reasons: string[]
}

export function FaultPanel({
  panelId,
  fault_code,
  fault_confidence,
  recommendation,
  voltage_drop_pct,
  current_drop_pct,
  reasons,
}: FaultPanelProps) {
  const { data: correlation, isLoading } = useQuery<CorrelationResult>({
    queryKey: ['correlation', panelId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/panels/${panelId}/correlation`)
      if (!response.ok) throw new Error('Failed to fetch correlation data')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(panelId),
  })

  const vDrop = voltage_drop_pct ?? 0
  const iDrop = current_drop_pct ?? 0

  const getConfidenceColor = (code: string) => {
    if (code === 'NORMAL') return 'bg-accentGreen'
    if (code === 'SOILING_DUST' || code === 'DEGRADATION') return 'bg-amber'
    if (code === 'NIGHTTIME') return 'bg-gray-400'
    return 'bg-danger'
  }

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <StatusBadge status="normal" label="Improving" />
      case 'degrading':
        return <StatusBadge status="danger" label="Degrading" />
      default:
        return <StatusBadge status="nighttime" label="Stable" />
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Diagnostics Hub</CardTitle>
        <CardDescription>Deep-dive fault analysis and signal correlation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Section 1: Current Fault */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-textMuted">Current Fault</h3>
            <StatusBadge
              status={fault_code === 'NORMAL' ? 'normal' : fault_code === 'NIGHTTIME' ? 'nighttime' : 'warning'}
              label={fault_code.replaceAll('_', ' ')}
            />
          </div>
          <p className="text-sm leading-6 text-textPrimary">{recommendation}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-medium text-textMuted uppercase">
              <span>Detection Confidence</span>
              <span>{(fault_confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-border overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${getConfidenceColor(fault_code)}`}
                style={{ width: `${fault_confidence * 100}%` }}
              />
            </div>
          </div>
          
          {reasons && reasons.length > 0 && (
            <div className="mt-4 space-y-2 rounded-xl border border-border bg-bgSurface/50 p-4">
               <h4 className="text-[10px] font-bold uppercase tracking-widest text-textMuted mb-2">Technical Evidence</h4>
               <ul className="space-y-2">
                 {reasons.map((reason, idx) => (
                   <li key={idx} className="flex items-start gap-2 text-xs text-textMuted group">
                     <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accentGreen transition-all group-hover:scale-150" />
                     <span className="leading-relaxed">{reason}</span>
                   </li>
                 ))}
               </ul>
            </div>
          )}
        </div>

        {/* Section 2: Signal Breakdown */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-textMuted">Signal Breakdown</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-medium text-textMuted">
                <span>Voltage Drop</span>
                <span>{vDrop.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, vDrop)}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-medium text-textMuted">
                <span>Current Drop</span>
                <span>{iDrop.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                <div className="h-full bg-teal-500" style={{ width: `${Math.min(100, iDrop)}%` }} />
              </div>
            </div>
          </div>
          <p className="text-xs text-textMuted text-center font-medium italic">
            {vDrop > iDrop + 2
              ? 'Voltage-dominant — shading/component issue suspected'
              : iDrop > vDrop + 2
                ? 'Current-dominant — soiling/dust buildup suspected'
                : 'Balanced signals — likely general degradation or uniform environment'}
          </p>
        </div>

        {/* Section 3: Daily Real-time Correlation */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-textMuted">Daily Real-time Insight</h3>
            {isLoading ? <Skeleton className="h-6 w-16" /> : getTrendBadge(correlation?.ei_trend || 'stable')}
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="space-y-3 rounded-xl bg-bgSurface p-4">
              <div className="flex justify-between text-sm">
                <span className="text-textMuted">GHI Correlation</span>
                <span className="font-medium text-textPrimary">{correlation?.ghi_vs_ei_correlation}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-textMuted">Temp Correlation</span>
                <span className="font-medium text-textPrimary">{correlation?.temp_vs_ei_correlation}</span>
              </div>
              <div className="pt-2 border-t border-border flex flex-col gap-2">
                <p className="text-xs text-textMuted text-center">
                  Peak output typically at <span className="font-bold text-textPrimary">{correlation?.best_hour}:00</span>
                </p>
                {correlation?.best_hour !== correlation?.worst_hour && (
                  <p className="text-xs text-textMuted text-center">
                    Lowest output at <span className="font-bold text-textPrimary">{correlation?.worst_hour}:00</span>
                  </p>
                )}
                <p className="text-xs font-medium text-accentGreen text-center mt-1">
                  {correlation?.avg_loss_w.toFixed(0)} W avg gap vs expected
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default FaultPanel
