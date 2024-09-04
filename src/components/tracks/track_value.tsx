"use client";

import React, { PureComponent, useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  BarChart,
  Bar,
  Brush,
  ReferenceLine,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useStore } from "@/app/store";
import { number } from "zod";

const gv = 0.01875;

// export function TrackValue2({ className }: React.HTMLAttributes<HTMLElement>) {
//   return (
//     <div className="overflow-x-scroll">
//       <BarChart width={2000} height={300} data={data1} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
//         <CartesianGrid strokeDasharray="3 3" />
//         <XAxis dataKey="name" />
//         <YAxis />
//         <Tooltip />
//         <Legend verticalAlign="top" wrapperStyle={{ lineHeight: "40px" }} />
//         <ReferenceLine y={0} stroke="#000" />
//         <Brush dataKey="name" height={30} stroke="#8884d8" />
//         <Bar dataKey="pv" fill="#8884d8" />
//         <Bar dataKey="uv" fill="#82ca9d" />
//       </BarChart>
//     </div>
//   );
// }

function convertMsToMinSecMs(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  milliseconds %= 60000;
  const seconds = Math.floor(milliseconds / 1000);
  milliseconds %= 1000;

  let ret = "";
  if (minutes > 0) {
    ret = `${minutes}:${seconds.toString()}:${milliseconds.toString().padStart(3, "0").replace(/0$/, "")}`;
  } else {
    if (seconds == 0 && milliseconds == 0) {
      ret = "";
    } else {
      ret = `${seconds.toString()}:${milliseconds.toString().padStart(3, "0").replace(/0$/, "")}`;
    }
  }
  // console.log(
  //   "minutes ",
  //   milliseconds.toString().padStart(3, "0"),
  //   milliseconds.toString().padStart(2, "0"),
  //   milliseconds.toString().padStart(1, "0")
  // );

  return ret;
}

export function TrackValue({ className }: React.HTMLAttributes<HTMLElement>) {
  const { state } = useStore();

  const [chartData, setChartData] = useState([] as any);
  const [activeIndex, setActiveIndex] = useState(10);

  // useEffect(() => {
  //   let interval: any;
  //   // 定时器每秒更新一次活动索引
  //   if (chartData) {
  //     interval = setInterval(() => {
  //       setActiveIndex((prevIndex) => (prevIndex + 1) % chartData.length);
  //     }, 1000); // 1秒更新一次
  //   }

  //   // 清理定时器
  //   return () => clearInterval(interval);
  // }, [chartData]);

  // const total = React.useMemo(
  //   () => ({
  //     Speed: chartData.reduce((acc, curr) => acc + curr.Speed, 0),
  //     G: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
  //   }),
  //   []
  // );

  useEffect(() => {
    console.log("TrackValue useEffect", state.app.sa.trackInfo);

    const trackInfo = state.app.sa.trackInfo;

    if (state.app.sa.trackInfo?.data) {
      const _chartData = state.app.sa.trackInfo.data.slice(0, 2000).map((item, idx) => {
        return { timer: idx * 10 + "", speed: item[7], acc: (parseInt(item[5]) * gv).toFixed(3), accv: item[5] };
      });

      setChartData(_chartData);
      console.log("TrackValue chartData", _chartData);
    }
  }, [state.app.sa.trackInfo]);

  const chartConfig = {
    acc: {
      label: "Acc",
      color: "hsl(var(--chart-1))",
    },
    speed: {
      label: "Speed",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-[10000px]">
      <LineChart data={chartData} accessibilityLayer syncId="anyId">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          orientation="top"
          dataKey="timer"
          // type="number"
          // tickLine={false}
          // axisLine={false}
          // tickMargin={2}
          // minTickGap={8}
          // tickFormatter={(value) => {
          //   return convertMsToMinSecMs(value);
          // }}
          interval={4}
          // ticks={chartData
          //   .filter((_: any, index: number) => index % 5 === 0)
          //   .map((item: { timer: any }) => {
          //     //console.log("tickFormatter value", item);
          //     return item.timer;
          //   })}
          tick={<CustomizedAxisTick />}
        />

        <ChartTooltip
          cursor={{ stroke: "red", strokeWidth: 2 }}
          active={true}
          // position={{ x: 100 }}
          position={{ x: activeIndex, y: 0 }} // 手动设置Tooltip位置
          //position={chartData[activeIndex] ? { x: (activeIndex * 600) / (chartData.length - 1), y: 0 } : { x: 0, y: 0 }}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => {
                return convertMsToMinSecMs(value);
              }}
              indicator="line"
            />
          }
        />
        <YAxis type="number" domain={[0, 115]} allowDataOverflow orientation="left" yAxisId="1" />
        <YAxis
          type="number"
          domain={[-1.5, +1.5]}
          ticks={[-1.5, -1, -0.5, 0, 0.5, 1, 1.5]}
          allowDataOverflow
          yAxisId="2"
          interval={0}
          orientation="right"
        />

        <Line dataKey="speed" stroke="var(--color-speed)" dot={false} yAxisId="1" />
        <Line dataKey="acc" stroke="var(--color-acc)" dot={false} yAxisId="2" />
      </LineChart>
      {/*
      <LineChart data={chartData} accessibilityLayer syncId="anyId">
        <CartesianGrid />
        <XAxis
          dataKey="timer"
          //type="number"
          tickLine={false}
          axisLine={false}

          tickFormatter={(value) => {
            return "";
          }}
          interval={4}

        />
        <ChartTooltip
          cursor={true}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => {
                return convertMsToMinSecMs(value);
              }}
              indicator="line"
            />
          }
        />
        <Line dataKey="acc" stroke="var(--color-acc)" dot={false} />
      </LineChart>

      */}
    </ChartContainer>
  );
}

class CustomizedLabel extends PureComponent {
  render() {
    const { x, y, stroke, value } = this.props as any;

    return (
      <text x={x} y={y} dy={16} fontSize={10} className="text-red-700" textAnchor="middle">
        {value}
      </text>
    );
  }
}

class CustomizedAxisTick extends PureComponent {
  render() {
    const { x, y, stroke, payload } = this.props as any;
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={20} y={-10} dy={10} textAnchor="end" fill="#666" transform="rotate(-35)">
          {convertMsToMinSecMs(payload.value)}
        </text>
      </g>
    );
  }
}
