"use client";
import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
const chartData = [{ month: "january", desktop: 1260, mobile: 570 }];
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "red",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function TrackInfo({ className }: React.HTMLAttributes<HTMLElement>) {
  const totalVisitors = chartData[0].desktop + chartData[0].mobile;

  return (
    <div className="flex max-w-100 max-h-48 bg-white">
      {/* <div className="container flex max-w-6xl h-16 justify-center items-center text-sm">a</div> */}
      <div className="flex-row bg-gray-100 w-1/2">
        <div>speed 100kmh</div>
        <div>section 1</div>
        <div>lap 1</div>
      </div>
      <div className="flex-row bg-gray-300 w-1/2">
        <div className="">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full w-full mt-3">
            <RadialBarChart data={chartData} endAngle={180} innerRadius={70} outerRadius={110}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={(c: any) => {
                    const { viewBox } = c;
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 16}
                            className="fill-foreground text-2xl font-bold"
                          >
                            hello
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 4} className="fill-muted-foreground">
                            Visitors
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </PolarRadiusAxis>
              <RadialBar
                dataKey="desktop"
                stackId="a"
                cornerRadius={5}
                fill="var(--color-desktop)"
                className="stroke-transparent stroke-2"
              />
              <RadialBar
                dataKey="mobile"
                fill="var(--color-mobile)"
                stackId="a"
                cornerRadius={5}
                className="stroke-transparent stroke-2"
              />
            </RadialBarChart>
          </ChartContainer>
        </div>
        <div className="">map2</div>
      </div>
    </div>
  );
}
