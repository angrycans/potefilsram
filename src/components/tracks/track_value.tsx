"use client";

import React, { PureComponent, useEffect, useRef, useLayoutEffect, useState } from "react";
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
  Dot,
  Cross,
  Customized,
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
import { Slider } from "@/components/ui/slider";
import useSize from "@/hooks/use-size";

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
  const lineChartRef = useRef(null);

  const lineChartRefSize = useSize(lineChartRef);

  const [chartData, setChartData] = useState([] as any);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    console.log("TrackValue useEffect", state.app.sa.trackInfo);

    const trackInfo = state.app.sa.trackInfo;

    if (state.app.sa.trackInfo?.data) {
      const _chartData = state.app.sa.trackInfo.data.slice(0, 100).map((item, idx) => {
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
    <div className="flex flex-col w-full h-full border-2 border-red-400 z-50">
      <div className="h-10">
        <Slider
          defaultValue={[0]}
          max={100}
          step={1}
          className="p-2 w-full"
          onValueChange={(val) => {
            //console.log(val);
            setProgress(val[0]);
          }}
        />
      </div>
      <div className="flex h-full z-10">
        <div className="flex-none w-14 bg-gray-100 border-2 border-green-400 z-0">01</div>
        <div className="flex-grow w-min-0 w-[300px] border-2 border-blue-400 z-0">
          <div ref={lineChartRef} className=" border-2 border-green-400 h-full overflow-x-auto z-0">
            <ChartContainer config={chartConfig} className="aspect-auto h-full w-[1000px] overflow-x: auto">
              <LineChart
                data={chartData}
                accessibilityLayer
                syncId="anyId"
                // onMouseMove={(e) => {
                //   console.log("LineChart onMouseMove", e);
                // }}
                onClick={(e: any) => {
                  console.log("LineChart onClick", e);
                }}

                // className="pointer-events-none"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis orientation="top" dataKey="timer" interval={4} tick={<CustomizedAxisTick />} />

                <ChartTooltip
                  //cursor={{ stroke: "red", strokeWidth: 2 }}
                  //cursor={<CustomCursor />}
                  active={true}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return convertMsToMinSecMs(value);
                      }}
                      indicator="line"
                    />
                  }
                />
                <YAxis type="number" domain={[0, 115]} allowDataOverflow orientation="left" yAxisId="1" hide />
                <YAxis
                  type="number"
                  domain={[-1.5, +1.5]}
                  ticks={[-1.5, -1, -0.5, 0, 0.5, 1, 1.5]}
                  allowDataOverflow
                  yAxisId="2"
                  interval={0}
                  orientation="right"
                  hide
                />

                <Line
                  isAnimationActive={false}
                  dataKey="speed"
                  stroke="var(--color-speed)"
                  dot={false}
                  activeDot={<CustomActiveDot stroke="#ffffff" />}
                  yAxisId="1"
                />
                <Line dataKey="acc" stroke="var(--color-acc)" dot={false} yAxisId="2" />
                <Customized component={<CustomizedCross progress={progress} />} />
              </LineChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

const CustomizedCross = (props: any) => {
  const { width, height, stroke, fill, formattedGraphicalItems, point } = props;

  // const [progress, setProgress] = useState(props.progress);

  // useEffect(() => {
  //   setProgress(props.progress);
  //   console.log("CustomizedCross progress", progress);
  // }, [props.progress]);

  // console.log(props.progress);
  // // get first series in chart
  // const firstSeries = formattedGraphicalItems[0];
  // const secondSeries = formattedGraphicalItems[1];
  // // get any point at any index in chart
  // const firstPoint = firstSeries?.props?.points[props.progress];
  // const secondPoint = secondSeries?.props?.points[props.progress];

  // render custom content using points from the graph
  return (
    <>
      <Line
        // isAnimationActive={true}
        // className="transition: all 0.1s ease"
        x1={formattedGraphicalItems[0].props?.points[props.progress]?.x}
        y1="35"
        x2={formattedGraphicalItems[0].props?.points[props.progress]?.x}
        y2={height} // 图表的高度
        stroke="red"
        strokeWidth={2}
      />
      <Dot
        cx={formattedGraphicalItems[0].props?.points[props.progress]?.x}
        cy={formattedGraphicalItems[0].props?.points[props.progress]?.y}
        r={4}
        stroke={"var(--color-speed)"}
      />
      <Dot
        cx={formattedGraphicalItems[1].props?.points[props.progress]?.x}
        cy={formattedGraphicalItems[1].props?.points[props.progress]?.y}
        r={4}
        stroke={"var(--color-acc)"}
      />
    </>
    // <Cross
    //   y={secondPoint?.y}
    //   x={secondPoint?.x}
    //   top={5}
    //   left={50}
    //   height={height}
    //   width={width}
    //   stroke={stroke ?? "red"}
    //   fill={fill ?? "none"}
    // />
  );
};

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
const CustomActiveDot = (props: any) => {
  const { x, y, stroke, payload, cx, cy } = props;

  //console.log("CustomActiveDot", props);
  return <Dot cx={cx} cy={cy} r={4} stroke={stroke} />;
};

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

const CustomCursor = (props: any) => {
  const { points } = props;
  //const { x } = points[0];
  const { x } = points[0];

  // console.log("customcursor", props, points);
  return (
    <Line
      className="z-10"
      x1={x}
      y1="0"
      x2={x}
      y2="300" // 图表的高度
      stroke="#ffffff"
      strokeWidth={2}
    />
  );
};

export function TrackValue2({ className }: React.HTMLAttributes<HTMLElement>) {
  const { state } = useStore();

  const [chartData, setChartData] = useState([] as any);
  const [progress, setProgress] = useState(0);

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
      const _chartData = state.app.sa.trackInfo.data.slice(0, 100).map((item, idx) => {
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
    <div className="w-full">
      <div className="flex h-full">
        <div className="flex-none w-14 ...">01</div>
        <div className="flex-1 w-64 ...">02</div>
      </div>
      <Slider
        defaultValue={[30]}
        max={100}
        step={10}
        className="p-2 w-full"
        onValueChange={(val) => {
          console.log(val);
          setProgress(val[0]);
        }}
      />

      <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-[100px] ">
        <LineChart
          data={chartData}
          accessibilityLayer
          syncId="anyId"
          // onMouseMove={(e) => {
          //   console.log("LineChart onMouseMove", e);
          // }}
          onClick={(e: any) => {
            console.log("LineChart onClick", e);
          }}

          // className="pointer-events-none"
        >
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
            //cursor={{ stroke: "red", strokeWidth: 2 }}
            // cursor={<CustomCursor />}
            active={true}
            // position={{ x: 100 }}
            //position={{ x: 0, y: 0 }} // 手动设置Tooltip位置
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
          <YAxis type="number" domain={[0, 115]} allowDataOverflow orientation="left" yAxisId="1" hide />
          <YAxis
            type="number"
            domain={[-1.5, +1.5]}
            ticks={[-1.5, -1, -0.5, 0, 0.5, 1, 1.5]}
            allowDataOverflow
            yAxisId="2"
            interval={0}
            orientation="right"
            hide
          />

          <Line
            isAnimationActive={false}
            dataKey="speed"
            stroke="var(--color-speed)"
            dot={false}
            activeDot={<CustomActiveDot stroke="#ccc" />}
            yAxisId="1"

            // onMouseMove={(e) => {
            //   console.log("Line onMouseMove", e);
            // }}
          />
          <Line dataKey="acc" stroke="var(--color-acc)" dot={false} yAxisId="2" />
          <Customized component={CustomizedCross} />
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
    </div>
  );
}
