import { RefreshCw } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { usePanelHistory } from '../../hooks/usePanelHistory'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'

type PerformanceChartProps = {
  panelId: string
}

export function PerformanceChart({ panelId }: PerformanceChartProps) {
  const { data, isLoading, refetch, isFetching } = usePanelHistory(panelId, 30)

  // Aggregate readings by day for a cleaner BarChart view
  const aggregatedData = (data ?? []).reduce((acc: Record<string, any>, reading) => {
    const date = new Date(reading.time).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric'
    })
    if (!acc[date]) {
      acc[date] = { time: date, actual: 0, expected: 0, count: 0 }
    }
    acc[date].actual += Number(reading.power_w ?? 0)
    acc[date].expected += Number(reading.p_expected ?? 0)
    acc[date].count += 1
    return acc
  }, {})

  const chartData = Object.values(aggregatedData)
    .map((d: any) => ({
      ...d,
      actual: d.actual / d.count, // average for the day
      expected: d.expected / d.count // average for the day
    }))
    .reverse()

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-2">
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>
            Actual vs Expected output.
          </CardDescription>
        </div>
        <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[320px] w-full rounded-3xl" />
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#E8E8E5" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#6B6B6B"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  interval={chartData.length > 10 ? 4 : 0}
                />
                <YAxis stroke="#6B6B6B" tickLine={false} axisLine={false} fontSize={10} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar
                  dataKey="actual"
                  name="Actual (Avg W)"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                  barSize={chartData.length > 15 ? 12 : 20}
                />
                <Bar
                  dataKey="expected"
                  name="Expected (Avg W)"
                  fill="#94A3B8"
                  radius={[4, 4, 0, 0]}
                  barSize={chartData.length > 15 ? 12 : 20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PerformanceChart
