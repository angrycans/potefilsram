"use client";

import React, { useMemo, useState } from "react";
import type { EChartsOption } from "echarts";

import { useStore } from "@/app/store";
import { Slider } from "@/components/ui/slider";

import ReactECharts from "echarts-for-react";

const gv = 0.01875;
const sv = 1.609344;

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

  return ret;
}

type TrackDataRow = (string | number)[];

type ChartRow = {
  timer: string;
  speed: string;
  acc: string;
  accv: string | number;
};

export function TrackValue({ className }: React.HTMLAttributes<HTMLElement>) {
  const { state } = useStore();
  const [progress, setProgress] = useState(0);

  const option = useMemo<EChartsOption | null>(() => {
    const trackData = state.app.sa.trackInfo?.data as TrackDataRow[] | undefined;

    if (!trackData) {
      return null;
    }

    const chartData: ChartRow[] = trackData.slice(0, 1000).map((item, idx) => ({
      timer: String(idx * 10),
      speed: (Number(item[7]) * sv).toFixed(0),
      acc: (parseInt(String(item[5]), 10) * gv).toFixed(3),
      accv: item[5],
    }));

    return {
      title: {
        text: "Speed Over Time",
      },
      dataset: {
        dimensions: ["timer", "speed", "acc", "accv"],
        source: chartData,
      },
      tooltip: {
        trigger: "axis",
      },
      dataZoom: [
        {
          type: "inside",
          startValue: 0,
          endValue: 100,
          zoomLock: true,
        },
      ],
      xAxis: {
        type: "category",
        position: "top",
        axisTick: {
          interval: 4,
          length: 5,
          alignWithLabel: true,
          inside: true,
        },
        axisLine: {
          onZero: false,
        },
        axisLabel: {
          interval: 4,
          margin: 10,
          rotate: 45,
          inside: false,
          formatter(value: string | number) {
            return convertMsToMinSecMs(Number(value));
          },
        },
      },
      yAxis: [
        {
          type: "value",
          position: "left",
          min: 0,
          max: 150,
        },
        {
          type: "value",
          position: "right",
          splitNumber: 7,
          min: -1.5,
          max: 1.5,
          splitLine: {
            show: false,
          },
        },
      ],
      series: [
        {
          name: "speed",
          type: "line",
          yAxisIndex: 0,
          encode: {
            x: "timer",
            y: "speed",
          },
        },
        {
          name: "acc",
          type: "line",
          yAxisIndex: 1,
          encode: {
            x: "timer",
            y: "acc",
          },
        },
      ],
    };
  }, [state.app.sa.trackInfo]);

  return (
    <div className={`flex flex-col w-full h-full border-2 border-red-400 z-50 ${className ?? ""}`}>
      <div className="h-10">
        <Slider
          value={[progress]}
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
        <div className="flex-grow w-min-0 w-[300px] border-2 border-blue-400 z-0 bg-white">
          <div className=" border-2 border-green-400 h-full overflow-x-auto z-0">
            {option && <ReactECharts option={option} />}
          </div>
        </div>
      </div>
    </div>
  );
}
