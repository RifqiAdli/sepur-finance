"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface TopClientsChartProps {
  clients: any[]
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
}

export function TopClientsChart({ clients }: TopClientsChartProps) {
  const chartData = clients.slice(0, 5).map((client) => ({
    name: client.client_name.length > 15 ? client.client_name.substring(0, 15) + "..." : client.client_name,
    revenue: Number(client.total_revenue) || 0,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Clients by Revenue</CardTitle>
        <CardDescription>Highest revenue generating clients</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
              />
              <Bar dataKey="revenue" fill={chartConfig.revenue.color} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
