// @ts-nocheck

//Calculates if finish line was crossed
//https://github.com/rgmorales/MiniLapTimer/blob/master/LapTimerMini.ino

function segmentsIntersect(lat1: number, lon1: number, lat2: number, lon2: number, finishLineLat1: number, finishLineLon1: number, finishLineLat2: number, finishLineLon2: number) {
  // does line(p1, p2) intersect line(p3, p4)
  let fDeltaX = lat2 - lat1;
  let fDeltaY = lon2 - lon1;
  let da = finishLineLat2 - finishLineLat1;
  let db = finishLineLon2 - finishLineLon1;
  if ((da * fDeltaY - db * fDeltaX) == 0) {
    //The segments are parallel
    return false;

  }
  let s = (fDeltaX * (finishLineLon1 - lon1) + fDeltaY * (lat1 - finishLineLat1)) / (da * fDeltaY - db * fDeltaX);
  let t = (da * (lon1 - finishLineLon1) + db * (finishLineLat1 - lat1)) / (db * fDeltaX - da * fDeltaY);

  return (s >= 0) && (s <= 1) && (t >= 0) && (t <= 1);
}

// 过终点的2点和终点线的交点
//https://github.com/JimEli/gps_lap_timer/blob/master/utility.h
//let cp = IntersectPoint({ lat: +prev[1], lng: +prev[2] }, { lat: +pos[1], lng: +pos[2] }, { lat: +finishData.lat1, lng: +finishData.lng1 }, { lat: +finishData.lat2, lng: +finishData.lng2 })
function IntersectPoint(p1, p2, s0, s1) {
  let denom: number, numera: number, mua: number; //numerb, mub;

  denom = (s1.lng - s0.lng) * (p2.lat - p1.lat) - (s1.lat - s0.lat) * (p2.lng - p1.lng);
  numera = (s1.lat - s0.lat) * (p1.lng - s0.lng) - (s1.lng - s0.lng) * (p1.lat - s0.lat);

  mua = numera / denom;

  return [p1.lng + mua * (p2.lng - p1.lng), p1.lat + mua * (p2.lat - p1.lat)];

}


function Distance(la1, lo1, la2, lo2) {
  var La1 = la1 * Math.PI / 180.0;
  var La2 = la2 * Math.PI / 180.0;
  var La3 = La1 - La2;
  var Lb3 = lo1 * Math.PI / 180.0 - lo2 * Math.PI / 180.0;
  var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(La3 / 2), 2) + Math.cos(La1) * Math.cos(La2) * Math.pow(Math.sin(Lb3 / 2), 2)));
  s = s * 6378.137; //地球半径
  s = Math.round(s * 10000) / 10000;
  return s
}

export { segmentsIntersect, Distance, IntersectPoint }
