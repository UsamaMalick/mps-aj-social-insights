"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { formatCompact, formatLift, formatPercent } from "@/lib/format";

const FORMATTERS = {
  percent: formatPercent,
  compact: formatCompact,
  lift: formatLift,
} as const;

export type ValueFormat = keyof typeof FORMATTERS;

export interface BarDatum {
  label: string;
  value: number;
  color: string;
  /** Shown in the tooltip, so meaning never depends on colour alone. */
  note?: string;
}

interface BarChartCardProps {
  title: string;
  description?: string;
  data: BarDatum[];
  valueLabel: string;
  valueFormat: ValueFormat;
  legend?: { label: string; color: string }[];
}

export function BarChartCard({
  title,
  description,
  data,
  valueLabel,
  valueFormat,
  legend,
}: BarChartCardProps) {
  const formatValue = FORMATTERS[valueFormat];
  const config: ChartConfig = { value: { label: valueLabel } };
  const height = Math.max(data.length * 34, 160);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <ChartContainer config={config} className="w-full" style={{ height }}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickFormatter={formatValue} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={170}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => (
                    <span className="tabular-nums">
                      {formatValue(Number(value))}
                      {(item.payload as BarDatum).note
                        ? ` · ${(item.payload as BarDatum).note}`
                        : ""}
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="value" radius={4}>
              {data.map((datum) => (
                <Cell key={datum.label} fill={datum.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        {legend ? (
          <ul className="text-muted-foreground flex flex-wrap gap-4 text-xs">
            {legend.map((entry) => (
              <li key={entry.label} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: entry.color }} />
                {entry.label}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
