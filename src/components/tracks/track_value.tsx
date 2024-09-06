"use client";

import React, { PureComponent, useEffect, useRef, useLayoutEffect, useState } from "react";

import { useStore } from "@/app/store";
import { Slider } from "@/components/ui/slider";
import useSize from "@/hooks/use-size";

import ReactECharts from "echarts-for-react";

interface DataItem {
  name: string;
  value: [string, number];
}

const gv = 0.01875;

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
export function TrackValue({ className }: React.HTMLAttributes<HTMLElement>) {
  const { state } = useStore();
  const lineChartRef = useRef(null);

  const lineChartRefSize = useSize(lineChartRef);

  const [chartData, setChartData] = useState([] as any);
  const [option, setOption] = useState();
  const [progress, setProgress] = useState(0);

  let data: DataItem[] = [];
  let now = new Date(1997, 9, 3);
  let oneDay = 24 * 3600 * 1000;
  let value = Math.random() * 1000;

  function randomData(): DataItem {
    now = new Date(+now + oneDay);
    value = value + Math.random() * 21 - 10;
    return {
      name: now.toString(),
      value: [[now.getFullYear(), now.getMonth() + 1, now.getDate()].join("/"), Math.round(value)],
    };
  }
  for (var i = 0; i < 1000; i++) {
    data.push(randomData());
  }

  useEffect(() => {
    console.log("TrackValue useEffect", state.app.sa.trackInfo);

    const trackInfo = state.app.sa.trackInfo;

    if (state.app.sa.trackInfo?.data) {
      const _chartData = state.app.sa.trackInfo.data.slice(0, 100).map((item, idx) => {
        return { timer: idx * 10 + "", speed: item[7], acc: (parseInt(item[5]) * gv).toFixed(3), accv: item[5] };
      });

      // setChartData(_chartData);

      console.log("TrackValue chartData", _chartData);
      const timerData = _chartData.map((item) => item.timer);
      const speedData = _chartData.map((item) => item.speed);

      setOption({
        title: {
          text: "Speed Over Time",
        },
        tooltip: {
          trigger: "axis",
        },
        xAxis: {
          type: "category",
          data: timerData,
          name: "Time",
        },
        yAxis: {
          type: "value",
          name: "Speed",
        },
        series: [
          {
            name: "Speed",
            data: speedData,
            type: "line",
            smooth: true, // Makes the line smooth
          },
        ],
      });
    }
  }, [state.app.sa.trackInfo]);

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
        <div className="flex-grow w-min-0 w-[300px] border-2 border-blue-400 z-0 bg-white">
          <div ref={lineChartRef} className=" border-2 border-green-400 h-full overflow-x-auto z-0">
            {option && <ReactECharts option={option} />}
          </div>
        </div>
      </div>
    </div>
  );
}
