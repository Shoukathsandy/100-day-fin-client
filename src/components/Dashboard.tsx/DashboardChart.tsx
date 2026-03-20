import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

interface Props {
  data?: { date: string; amount: number }[]
}

export default function DashboardChart({ data }: Props) {
  const chartData = data ?? []

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Daily Collections</CardTitle>
        <CardDescription>Last 7 days payment activity</CardDescription>
      </CardHeader>

      <CardContent className="h-57.5 w-full">
        {chartData.every(d => d.amount === 0) ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No payment data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v === 0 ? '0' : `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                tick={{ fontSize: 11 }}
                width={48}
              />
              <Tooltip
                formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Collected']}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Bar
                dataKey="amount"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
