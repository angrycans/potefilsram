import dayjs from "dayjs";
import Color from "color";
import * as turf from "@turf/turf";
import { segmentsIntersect, IntersectPoint } from "@/lib/gpsutils";
import { useEffect, useMemo, useState } from "react";

import { fetcher } from "@/lib/utils";
import { number } from "zod";
import { subtractTimeStrings } from "./utils";
import { useStore } from "@/app/store";

export function useGetTrackData() {
  const { state, updateState } = useStore();

  //const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);

  useEffect(() => {
    (async () => {
      const ret = await fetcher(`/api/uploadthing/1`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("ret", ret);
      if (ret.code) {
        // setTrackInfo(parseData(ret.data));
        updateState((draft) => {
          draft.app.sa.trackInfo = parseData(ret.data);
        });
      }
    })();
  }, []);

  // return { trackInfo:str };
}

export interface ColorGradientInfo {
  /** 渐变颜色数据 */
  colorGradientData: (number | string)[];
  /** 采样点数据 */
  pointInfoData: (string | number)[][];
  /** 标记点集合 */
  markers: mapboxgl.Marker[];
}

/** 记录元数据 */
export interface TrackMeta {
  /** 文件格式版本 */
  version: string;
  /** 文件开始时间 */
  startDate: string;
  /** 用户ID */
  userId: string;
  /** 用户名称 */
  username: string;
  /** 载具名称 */
  carrierName: string;
  /** 硬件版本 */
  hardwareVersion: string;
  /** 固件版本 */
  firmwareVersion: string;
  /** 赛道名称 */
  racetrackName: string;
}

export interface RecordDataOverview {
  /** 总时间 */
  totalTime?: number;
  /** 最短圈时 */
  minCycleTime?: number;
  /** 最大速度 */
  maxSpeed?: string;
  /** 平均速度 */
  avgSpeed?: string;
  /** 平均圈时 */
  avgCycleTime?: number;
  /** 圈数 */
  cycleNum?: number;
}

interface lapInfo {
  /** 当前碰撞点下标 */
  idx: number;

  fidx?: number;
  /** 当前碰撞点经纬度 [经度，纬度] */
  intersectP: [number, number];
  /** 最大速度 */
  maxspeed: number;

  avgspeed?: number;
  /** 上一个碰撞点下标 */
  prv: number;
  /** 圈时 */
  timer: number;

  maxrightangle?: number;
  maxleftangle?: number;

  maxaccG?: number;
  maxbrakingG?: number;
}

export interface TrackInfo extends RecordDataOverview {
  /** 圈信息 */
  laps: lapInfo[];
  /** 点信息 */
  data: [number, ...string[]][];
  /** 赛道信息 */
  trackplan: [number, number, number, number][];

  unit: string | undefined;
  trackMeta: TrackMeta;
}

const metaShortKeyMap = {
  V: "version",
  D: "startDate",
  U: "userId",
  N: "username",
  M: "carrierName",
  H: "hardwareVersion",
  B: "firmwareVersion",
  T: "racetrackName",
  // sa
  DID: "userId",
  SW: "hardwareVersion",
  S: "racetrackName",
  FMV: "firmwareVersion",
} as const;

/**
 * 解析文件内容头信息
 * @param content 对应记录文件内容
 */
export function parseMeta(content: string): TrackMeta {
  return Array.from(content.matchAll(/#([^=#]+)=([^=]+)=/g)).reduce((acc, [, sKey, value]) => {
    const key = metaShortKeyMap[sKey.trim() as keyof typeof metaShortKeyMap];
    if (key) {
      acc[metaShortKeyMap[sKey.trim() as keyof typeof metaShortKeyMap]] = value.trim();
    }
    return acc;
  }, {} as TrackMeta);
}

/**
 * 解析赛道信息
 * @param content
 */
export function parsetrackplanData(content: string) {
  // xld: <tracksector>...<\/tracksector>; sa: <trackplan #sectors=8>...</trackplan>
  const tracksectorContentText = content.match(/<trackplan[^>]*>([^<]+)<\/trackplan>/)?.[1] || "";
  return tracksectorContentText
    .replaceAll(/[\r\n]+/g, ";")
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => chunk.split(",").slice(-4).map(Number) as [number, number, number, number]);
}

/*
export function parseLap(dataList: any[][], finishData: any): any {
  let prevPoint: any = null; //prev point
  let prev_idx = 0; //prev segmentsIntersect point idx in _sessionData
  let lastdatetime = 0; //prev  segmentsIntersect time mills()
  let tmplap: any = []; //lap info
  let maxspeed = 0;
  let prevItem; //prev segmentsIntersect item  endpoint
  let prevprevItem: any; //prev segmentsIntersect item  startpoint
  let prev_intersectpoint: any; //prev segmentsIntersect point startpoint-->endpoint intersect finishling

  dataList.forEach((pos, idx) => {
    if (prevPoint) {
      let isChecked = segmentsIntersect(
        parseFloat(pos[1]),
        parseFloat(pos[2]),
        parseFloat(prevPoint[1]),
        parseFloat(prevPoint[2]),
        finishData.lat1,
        finishData.lng1,
        finishData.lat2,
        finishData.lng2
      );
      if (isChecked) {
        let intersectP = IntersectPoint(
          { lat: +prevPoint[1], lng: +prevPoint[2] },
          { lat: +pos[1], lng: +pos[2] },
          { lat: +finishData.lat1, lng: +finishData.lng1 },
          { lat: +finishData.lat2, lng: +finishData.lng2 }
        );
        if (lastdatetime != 0) {
          // console.log("prev_cp", prev_intersectpoint, intersectP)
          var distance_point0 = turf.distance(
            [prevprevItem[1], prevprevItem[2]],
            [prev_intersectpoint[1], prev_intersectpoint[0]],
            { units: "kilometers" }
          );
          var distance_point1 = turf.distance([prevPoint[1], prevPoint[2]], [intersectP[1], intersectP[0]], {
            units: "kilometers",
          });
          let off0 = (distance_point0 / +prevprevItem[7]) * 60 * 60 * 1000;
          let off1 = (distance_point1 / +prevPoint[7]) * 60 * 60 * 1000;
          // console.log("distance", distance_point0, (+prevPoint[0] - lastdatetime), Math.round(off0), Math.round(off1), (+prevPoint[0] - lastdatetime) + Math.round(off1) - Math.round(off0));
          tmplap.push({
            prv: prev_idx - 1,
            idx: idx - 1,
            timer: +prevPoint[0] - lastdatetime - Math.round(off0) + Math.round(off1),
            maxspeed,
            intersectP,
          });
          maxspeed = 0;
        }
        lastdatetime = +prevPoint[0];
        prev_idx = idx;
        prevItem = pos;
        prevprevItem = prevPoint;
        prev_intersectpoint = intersectP;
      }
    }
    prevPoint = pos;
    if (+pos[7] > maxspeed) {
      maxspeed = +pos[7];
    }
  });

  return tmplap;
}
*/
// export function parseLap_old(dataList: any[][], finishData: any): any {
//   let prevPoint: any = null; //prev point
//   let prev_idx = 0; //prev segmentsIntersect point idx in _sessionData
//   let lastdatetime = 0; //prev  segmentsIntersect time mills()
//   let tmplap: any = []; //lap info
//   let maxspeed = 0;
//   let prevItem; //prev segmentsIntersect item  endpoint
//   let prevprevItem: any; //prev segmentsIntersect item  startpoint
//   let prev_intersectpoint: any; //prev segmentsIntersect point startpoint-->endpoint intersect finishling

//   dataList.forEach((pos, idx) => {
//     if (prevPoint) {
//       let isChecked = segmentsIntersect(
//         parseFloat(pos[1]),
//         parseFloat(pos[2]),
//         parseFloat(prevPoint[1]),
//         parseFloat(prevPoint[2]),
//         finishData.lat1,
//         finishData.lng1,
//         finishData.lat2,
//         finishData.lng2
//       );
//       if (isChecked) {
//         let intersectP = IntersectPoint(
//           { lat: +prevPoint[1], lng: +prevPoint[2] },
//           { lat: +pos[1], lng: +pos[2] },
//           { lat: +finishData.lat1, lng: +finishData.lng1 },
//           { lat: +finishData.lat2, lng: +finishData.lng2 }
//         );
//         if (lastdatetime != 0) {
//           // console.log("prev_cp", prev_intersectpoint, intersectP)
//           var distance_point0 = turf.distance(
//             [prevprevItem[1], prevprevItem[2]],
//             [prev_intersectpoint[1], prev_intersectpoint[0]],
//             { units: "kilometers" }
//           );
//           var distance_point1 = turf.distance([prevPoint[1], prevPoint[2]], [intersectP[1], intersectP[0]], {
//             units: "kilometers",
//           });
//           let off0 = (distance_point0 / +prevprevItem[7]) * 60 * 60 * 1000;
//           let off1 = (distance_point1 / +prevPoint[7]) * 60 * 60 * 1000;
//           // console.log("distance", distance_point0, (+prevPoint[0] - lastdatetime), Math.round(off0), Math.round(off1), (+prevPoint[0] - lastdatetime) + Math.round(off1) - Math.round(off0));
//           tmplap.push({
//             prv: prev_idx - 1,
//             idx: idx - 1,
//             timer: +prevPoint[0] - lastdatetime - Math.round(off0) + Math.round(off1),
//             maxspeed,
//             intersectP,
//           });
//           maxspeed = 0;
//         }
//         lastdatetime = +prevPoint[0];
//         prev_idx = idx;
//         prevItem = pos;
//         prevprevItem = prevPoint;
//         prev_intersectpoint = intersectP;
//       }
//     }
//     prevPoint = pos;
//     if (+pos[7] > maxspeed) {
//       maxspeed = +pos[7];
//     }
//   });

//   return tmplap;
// }

/**
 * 解析文件数据
 * @param content 对应记录文件内容
 */
export function parseData(content: string): TrackInfo {
  // console.log("parseData", content);
  let startDate = dayjs(content.match(/#D=([^=]+)=/)?.[1], "MM-DD-YYYY HH:mm:ss");

  const trackMeta = parseMeta(content);
  // xld: <point>...<\/point>; sa: <trace #pt=6207>...</trace>
  const pointContentText = content.match(/<trace[^>]*>([^<]+)<\/trace>/)?.[1] || "";
  const data = pointContentText
    .replaceAll(/[\r\n]+/g, ";")
    .split(";")
    .map((chunk) => {
      chunk = chunk.trim();
      if (chunk) {
        const chunkItemList = chunk.split(",") as [number, ...string[]];
        // xld col: 12; sa col: 11
        if (chunkItemList.length < 12) {
          // sa
          chunkItemList.unshift(+startDate);
          startDate = startDate.add(100, "ms");
        }

        return chunkItemList;
      }
    })
    .filter(Boolean) as [number, ...string[]][];

  // console.log("data", data);
  const trackplan = parsetrackplanData(content);
  // parseLap 经纬度 反了
  const [lat1, lng1, lat2, lng2] = trackplan?.[trackplan.length - 1];

  // console.log("trackplan", trackplan);

  // Extract the unit using regex
  let unit = content.match(/<timer #unit=(.+?)>/)?.[1];

  if (unit) {
    unit = "KM/h";
  }

  //console.log("unit", unit);

  const timerContentText = content.match(/<timer[^>]*>([^<]+)<\/timer>/)?.[1] || "";

  //console.log("timerContentText", timerContentText);

  const tmpcycle = timerContentText
    .trim()
    .replaceAll(/[\r\n]+/g, ";")
    .split(";");

  const laps: any[] = [];
  let sectors: any[] = [];
  //let lapidx = 0;

  for (let i = 0; i < tmpcycle.length; i += 2) {
    // console.log("_item", tmpcycle[i], tmpcycle[i + 1]);

    let sector: any = {};
    if (tmpcycle[i].startsWith("#")) {
      const [indexPart, timePart] = tmpcycle[i].split(",");
      sector.idx = parseInt(indexPart.slice(1), 10); // Extract index
      sector.time = timePart; // Extract time part
      //   console.log("sectors", sectors, sector.idx - 1);

      sector.idx - 1 > 0
        ? (sector.sectortime = subtractTimeStrings(sector.time, sectors[sector.idx - 2].time))
        : laps.length == 0
        ? (sector.sectortime = sector.time)
        : (sector.sectortime = subtractTimeStrings(sector.time, laps[laps.length - 1][trackplan.length - 1].time));

      // Check if the next line contains speed and angle data
      if (tmpcycle[i + 1]) {
        const nextLine = tmpcycle[i + 1].split(",");
        // Ensure the data line has at least 6 elements for valid data
        if (nextLine.length == 6) {
          sector.avgspeed = parseFloat(nextLine[0]);
          sector.maxspeed = parseFloat(nextLine[1]);
          sector.maxrightangle = parseInt(nextLine[2], 10);
          sector.maxleftangle = parseInt(nextLine[3], 10);
          sector.accG = parseFloat(nextLine[4]);
          sector.brakingG = parseFloat(nextLine[5]);
        }
      }

      sectors.push(sector);

      if (sector.idx == trackplan.length) {
        laps.length > 0 && console.log("laptime", laps[laps.length - 1][trackplan.length - 1]);
        laps.length == 0
          ? (sector.laptime = sector.time)
          : (sector.laptime = subtractTimeStrings(sector.time, laps[laps.length - 1][trackplan.length - 1].time));
        laps.push(sectors);
        sectors = [];
        // lapidx++;
      }
    }
  }

  //console.log("laps", laps);

  // const cycleInfoList: RaceCycle[] = parseLap_old(data, { lng1, lat1, lng2, lat2 });

  // // 修复 经纬度 顺序
  // cycleInfoList.forEach((cycle) => cycle.intersectP.reverse());
  // const totalTime = +dayjs(data[data.length - 1][0] - data[0][0]);
  // const maxSpeed = Math.max(...cycleInfoList.map((cycle) => cycle.maxspeed));
  // const minCycleTime = +dayjs(Math.min(...cycleInfoList.map((cycle) => cycle.timer)));
  // const cycleNum = cycleInfoList.length;
  // const avgSpeed = cycleNum ? cycleInfoList.reduce((acc, cycle) => acc + cycle.maxspeed, 0) / cycleNum : 0;
  // const avgCycleTime = cycleNum ? +dayjs(cycleInfoList.reduce((acc, cycle) => acc + cycle.timer, 0) / cycleNum) : 0;
  // console.log("cycleInfoList", cycleInfoList);
  // console.log("racetracks", racetracks);
  return {
    trackplan,
    data,
    laps,
    unit,
    trackMeta,
  };
}
