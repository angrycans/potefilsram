import Color from "color";
import mapboxgl from "mapbox-gl";
import { range } from "lodash";

export type Position = number[]; // [number, number] | [number, number, number];

const MAX_SPEED_SHAKE_IGNORE = 0.1;
const MAX_COLOR_DEGREES = 120;
const MAX_SPEED_SHAKE = 0.001;

const enum BrakingColor {
  YELLOW = "#FFFF00",
  RED = "#FF0000",
  GREEN = "#00FF00",
}

const enum Trend {
  UP = "UP",
  DOWN = "DOWN",
  STABLE = "STABLE",
}

/**
 * 获取指定值在给定列表内最近的值
 * @param value 给定制
 * @param list 可选列表
 */
export function getNearestValue<T extends number>(value: number, list: T[]): T {
  return list.map((item) => ({ raw: item, delta: Math.abs(item - value) })).sort((a, b) => a.delta - b.delta)[0].raw;
}

/**
 * 获取趋势状态
 * @param delta 变化量
 */
function getTrend(delta: number | string): Trend {
  delta = +delta;
  if (Number.isNaN(delta)) throw new Error(`delta: ${delta} is not a valid number !`);
  if (delta === 0) return Trend.STABLE;
  return delta > 0 ? Trend.UP : Trend.DOWN;
}

/**
 * 获取趋势变化关键点
 * @param list
 */
function getTrendDiffKeyPoints(list: [number, ...string[]][], scanArea = 1): [number, [number, ...string[]]][] {
  const scanAreaRangeList = range(1, 1 + scanArea);
  const listWithDelta = list.map((item, idx) => [...item, String(idx ? +item[7] - +list[idx - 1][7] : 0)]);
  let preDeltaTrend = getTrend(listWithDelta[0][12]);
  const maxIdx = listWithDelta.length - 1;
  const trendDiffKeyPoints: [number, [number, ...string[]]][] = [];

  for (let i = 0; i < listWithDelta.length; i++) {
    const delta = +listWithDelta[i][12];
    const currentDeltaTrend = getTrend(delta);
    if (
      i >= scanArea &&
      i + scanArea <= maxIdx &&
      currentDeltaTrend !== preDeltaTrend &&
      scanAreaRangeList.every((offset: number) => getTrend(listWithDelta[i - offset][12]) === preDeltaTrend) &&
      scanAreaRangeList.every((offset: number) => getTrend(listWithDelta[i + offset][12]) === currentDeltaTrend)
    ) {
      trendDiffKeyPoints.push([i, list[i]]);
      preDeltaTrend = currentDeltaTrend;
    }

    if (!i || i === maxIdx) {
      trendDiffKeyPoints.push([i, list[i]]);
    }
  }

  return trendDiffKeyPoints;
}

/**
 * 获取严格的趋势变更关键节点列表
 * @param list
 */
function getStrictTrendDiffKeyPoints(list: [number, ...string[]][]): [number, ...string[]][] {
  const listWithDelta = list.map((item, idx) => [...item, String(idx ? +item[7] - +list[idx - 1][7] : 0)]);
  return listWithDelta
    .reduce(
      (acc, item, idx) => {
        const prevGroup = acc[acc.length - 1];
        const isPrevDeltaPositive = prevGroup[0];
        const delta = +item[12];
        if (isPrevDeltaPositive ? delta >= 0 : delta <= 0) {
          prevGroup[1].push(list[idx]);
        } else {
          acc.push([!isPrevDeltaPositive, [list[idx]]]);
        }
        return acc;
      },
      [[(listWithDelta[0][12] as number) >= 0, [list[0]]]] as [boolean, [number, ...string[]][]][]
    )
    .map(([isPrevDeltaPositive, group]) => {
      const speedList = group.map((item) => +item[7]);
      const targetSpeed = isPrevDeltaPositive ? Math.max(...speedList) : Math.min(...speedList);
      return group.find((item) => +item[7] === targetSpeed)!;
    });
}

export interface ColorGradientInfo {
  /** 渐变颜色数据 */
  colorGradientData: (number | string)[];
  /** 采样点数据 */
  pointInfoData: (string | number)[][];
  /** 标记点集合 */
  markers: mapboxgl.Marker[];
}

/**
 * 生成速度分布路径渐变
 * @param list
 */
export function generateSpeedColorGradient(list: [number, ...string[]][]): ColorGradientInfo {
  const speedList = list.map(({ 7: speed }) => +speed);
  const maxSpeed = Math.max(...speedList);
  const minSpeed = Math.min(...speedList);
  const speedDistance = maxSpeed - minSpeed;
  const maxSpeedColor = Color(BrakingColor.GREEN);
  const trendDiffKeyPoints = getTrendDiffKeyPoints(list);
  const colorGradientData = trendDiffKeyPoints.reduce((acc, [idx, item]) => {
    const speedDistancePercent = (+item[7] - maxSpeed) / speedDistance;
    const color = maxSpeedColor.rotate((speedDistancePercent * MAX_COLOR_DEGREES) | 0).hex();
    acc.push(idx / (list.length - 1), color);
    return acc;
  }, [] as (string | number)[]);
  const extremePoints = getStrictTrendDiffKeyPoints(trendDiffKeyPoints.slice(1, -1).map(([, item]) => item)).map(
    (item) => {
      const speedDistancePercent = (+item[7] - maxSpeed) / speedDistance;
      const color = maxSpeedColor.rotate((speedDistancePercent * MAX_COLOR_DEGREES) | 0).hex();
      return [...item, color];
    }
  );
  const markers = extremePoints.map((sample) => {
    const el = document.createElement("div");
    el.innerHTML = `${((sample[7] as number) * 1.609344).toFixed(0)} KMH`;
    el.className = "marker";
    el.style.backgroundColor = Color(sample[12]).fade(0.5).hexa();
    el.style.border = `1px solid ${Color(sample[12]).darken(0.5).hexa()}`;
    return new mapboxgl.Marker(el).setLngLat(sample.slice(1, 3).map(Number).reverse() as [number, number]);
  });

  return {
    markers,
    pointInfoData: extremePoints,
    colorGradientData,
  };
}

/**
 * 生成速度分布路径渐变
 * @param list
 */
export function generateSpeedColorGradient1(list: [number, ...string[]][]) {
  const speedList = list.map(({ 7: speed }) => +speed);
  const maxSpeed = Math.max(...speedList);
  const minSpeed = Math.min(...speedList);
  const speedDistance = maxSpeed - minSpeed;
  const maxSpeedColor = Color("#00FF00");
  const colorList = list.map((item) => {
    const speedDistancePercent = (+item[7] - maxSpeed) / speedDistance;
    return [
      ...item,
      speedDistancePercent,
      maxSpeedColor.rotate((speedDistancePercent * MAX_COLOR_DEGREES) | 0).hex(),
      (speedDistancePercent * MAX_COLOR_DEGREES) | 0,
    ];
  });

  let pre = +colorList[0][12];

  const colorGradientInfo = colorList.reduce(
    (acc, item, idx) => {
      if (!idx || idx === colorList.length - 1) {
        acc.colorGradientData.push(+!!idx, item[13]);
      } else {
        const currentSpeedDistancePercentShake = Math.abs(+item[12] - pre) > MAX_SPEED_SHAKE;
        if (currentSpeedDistancePercentShake) {
          acc.colorGradientData.push(idx / (colorList.length - 1), item[13]);
          acc.pointInfoData.push(item);
          pre = +item[12];
        }
      }
      return acc;
    },
    { colorGradientData: [], pointInfoData: [] } as Omit<ColorGradientInfo, "markers">
  );

  let preDegree = 0;
  const markers = colorGradientInfo.pointInfoData
    .reduce((acc, item) => {
      const currentDegree = getNearestValue(+item[14], [0, -60, -120]);
      if (preDegree === currentDegree && !!acc.length) {
        acc[acc.length - 1].group.push(item);
      } else {
        acc.push({ degree: currentDegree, group: [item] });
        preDegree = currentDegree;
      }
      return acc;
    }, [] as { degree: number; group: (string | number)[][] }[])
    .map(({ degree, group }) => {
      const nearestValue = getNearestValue(
        degree,
        group.map((item) => +item[14])
      );
      const sample = group.find((item) => (+item[14]).toFixed(2) === nearestValue.toFixed(2))!;
      const el = document.createElement("div");
      el.innerHTML = `${sample[7]} mph`;
      el.className = "marker";
      el.style.backgroundColor = Color(sample[13]).fade(0.5).hexa();
      el.style.border = `1px solid ${Color(sample[13]).darken(0.5).hexa()}`;
      return new mapboxgl.Marker(el).setLngLat(sample.slice(1, 3).map(Number).reverse() as [number, number]);
    });

  // const markers = colorList
  //   .reduce((acc, item, idx) => {
  //     if (idx - 1 >= 0 && idx + 1 < colorList.length) {
  //       // const { 7: speed } = item;
  //       // const speedDistance = +speed - prevSpeed;
  //       // prevSpeed = +speed;
  //       // if (Math.abs(speedDistance) > 0.1) {
  //       //   acc.push(item)
  //       // }

  //       const currentDistance = +item[7] - +colorList[idx - 1][7];
  //       const nextDistance = +colorList[idx + 1][7] - +item[7];
  //       if ((currentDistance > 0 && nextDistance < 0) || (currentDistance < 0 && nextDistance > 0)) {
  //         acc.push(item);
  //         console.log(colorList[idx - 1][7], item[7], colorList[idx + 1][7])
  //       }
  //     }
  //     return acc;
  //   }, [] as (string | number)[][])
  //   .map(sample => {
  //     const el = document.createElement('div');
  //     el.innerHTML = `${sample[7]} mph`;
  //     el.className = 'marker';
  //     el.style.backgroundColor = Color(sample[13]).fade(0.5).hexa();
  //     el.style.border = `1px solid ${Color(sample[13]).darken(0.5).hexa()}`;
  //     return new mapboxgl.Marker(el).setLngLat(sample.slice(1, 3).map(Number).reverse() as [number, number])
  //   })

  return {
    ...colorGradientInfo,
    markers,
  };
}

/**
 * 生成刹车路径渐变
 * @param list
 */
export function generateBrakingColorGradient(list: [number, ...string[]][]) {
  const avgSpeed = list.reduce((acc, { 7: speed }) => acc + +speed, 0) / list.length;
  let prevSpeed = +list[0][7];
  let prevColor = prevSpeed >= avgSpeed ? BrakingColor.GREEN : BrakingColor.RED;
  return list
    .reduce((acc, { 7: speed }, idx) => {
      if (!idx) {
        acc.push(0, prevColor);
      } else {
        const speedDistance = +speed - prevSpeed;
        if (Math.abs(speedDistance) > MAX_SPEED_SHAKE_IGNORE) {
          const percent = idx / (list.length - 1);
          if (
            (prevColor === BrakingColor.RED && speedDistance < 0) ||
            (prevColor === BrakingColor.GREEN && speedDistance > 0)
          ) {
            // 直接更新进度
            acc[acc.length - 2] = percent;
          } else {
            // 颜色变更
            acc.push(percent, prevColor);
            const nextColor = prevColor === BrakingColor.GREEN ? BrakingColor.RED : BrakingColor.GREEN;
            acc.push(percent, nextColor);
            prevColor = nextColor;
          }

          prevSpeed = +speed;
        }

        if (idx === list.length - 1 && acc[acc.length - 2] !== 1) {
          acc[acc.length - 2] = 1;
        }
      }
      return acc;
    }, [] as (number | string)[])
    .reduce(
      (acc, item, idx, arr) => {
        const { colorGradientData } = acc;
        if (idx === 1) {
          colorGradientData.push(arr[0], item);
        } else if (idx % 2) {
          const prePercent = arr[idx - 3];
          const currentPercent = arr[idx - 1];
          const currentColor = item;
          if (currentPercent !== prePercent) {
            if (colorGradientData[colorGradientData.length - 1] !== currentColor) {
              colorGradientData.push((+currentPercent + +prePercent) / 2, BrakingColor.YELLOW);
            }
            colorGradientData.push(currentPercent, currentColor);
          }
        }
        return acc;
      },
      { colorGradientData: [], pointInfoData: [], markers: [] } as ColorGradientInfo
    );
}

/**
 * 获取中心点
 * @param list
 */
export function getCenter(list: [number, number][]): [number, number] {
  const longitudeList = list.map(([longitude]) => +longitude);
  const latitudeList = list.map(([, latitude]) => +latitude);
  const maxLongitude = Math.max(...longitudeList);
  const minLongitude = Math.min(...longitudeList);
  const maxLatitude = Math.max(...latitudeList);
  const minLatitude = Math.min(...latitudeList);
  return [(maxLongitude + minLongitude) / 2, (maxLatitude + minLatitude) / 2];
}

export function getLineGeoJSON(coordinates: Position[]) {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          // @ts-ignore
          properties: {},
          coordinates: coordinates,
        },
      },
    ],
  } as any as GeoJSON.FeatureCollection<GeoJSON.LineString>;
}
