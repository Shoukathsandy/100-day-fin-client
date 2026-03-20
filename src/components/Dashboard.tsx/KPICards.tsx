import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { type LucideIcon } from "lucide-react"

type KpiCardProps = {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: "up" | "down"
  trendValue?: string
  color?: string
}

export default function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  color = "text-primary",
}: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-5 flex flex-col gap-3">

        {/* Top Row */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">
            {title}
          </span>

          {Icon && (
            <div className={`flex items-center justify-center h-9 w-9 rounded-lg bg-muted ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Main Value */}
        <div className="text-2xl font-bold tracking-tight">
          {value}
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{description}</span>

          {trend && (
            <div
              className={`flex items-center gap-1 font-medium ${
                trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trendValue}
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  )
}