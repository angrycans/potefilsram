"use client";
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl"; // or "const mapboxgl = require('mapbox-gl');"

import "mapbox-gl/dist/mapbox-gl.css";
import { chunk } from "lodash";

import { parseData, TrackInfo, useGetTrackData } from "./hooks";
import { fetcher } from "@/lib/utils";
import {
  generateSpeedColorGradient,
  generateBrakingColorGradient,
  getCenter,
  getLineGeoJSON,
  type ColorGradientInfo,
} from "./utils";
import { useStore } from "@/app/store";

mapboxgl.accessToken = "pk.eyJ1IjoiYW5ncnljYW5zIiwiYSI6ImNsenQ3d3RoODB6cGQyanB4eWpnajRzdXIifQ.-zxiz2mN5b5UPpcR8jOmBQ";

const colorGradientGeneratorMap: Record<string, (list: [number, ...string[]][]) => ColorGradientInfo> = {
  "0": generateSpeedColorGradient,
  "1": generateSpeedColorGradient,
  "2": generateBrakingColorGradient,
  "3": generateBrakingColorGradient,
};

export function TrackMap({ className }: React.HTMLAttributes<HTMLElement>) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const { state } = useStore();

  const _ = useGetTrackData();

  useEffect(() => {
    console.log("state.app.DashboardSidebar.isSidebarExpanded", state.app.DashboardSidebar.isSidebarExpanded);
    mapRef.current && (mapRef.current as any).resize();
  }, [state.app.DashboardSidebar.isSidebarExpanded]);

  // useEffect(() => {
  //   const fetchRaceData = async () => {
  //     try {
  //       const ret = await fetch("/api/uploadthing/1", {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       });

  //       const result = await ret.json();
  //       console.log("result", result);

  //       if (result.code) {
  //         const recordContentText = result.data;
  //         setDataInfo(parseData(recordContentText));
  //       }
  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //     }
  //   };

  //   fetchRaceData();
  //   console.log("dataInfo", dataInfo);
  // }, []);

  useEffect(() => {
    // mapboxgl.accessToken ="pk.eyJ1IjoiYW5ncnljYW5zIiwiYSI6ImNsenQ3d3RoODB6cGQyanB4eWpnajRzdXIifQ.-zxiz2mN5b5UPpcR8jOmBQ";
    console.log("TrackMap init");
    let currentMarkers: mapboxgl.Marker[] | null = null;

    const trackInfo = state.app.sa.trackInfo;

    if (!mapRef.current) {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current as any,
        center: [118.98626, 31.934493], // starting position [lng, lat]
        zoom: 17, // starting zoom
        //style: "mapbox://styles/mapbox/blank-v9",
        // style: "mapbox://styles/mapbox/dark-v11",
        // style: "mapbox://styles/mapbox/standard",
        //style: "mapbox://styles/angrycans/cm06iwu2w00jo01pwcgvb3czg",
        style: {
          version: 8,
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: {
                "background-color": "#1e1f1d", // Set background color to white
              },
            },
          ],
        },
      });

      console.log("mapbox style", map.style);

      mapRef.current = map as any;
    }

    console.log("TrackMap trackinfo", trackInfo);

    if (trackInfo?.data) {
      const SOURCE_LINE_ID = "source-line";
      const LAYER_LINE_ID = "layer-line";
      const SOURCE_RACETRACK_ID = "source-racetrack";
      const LAYER_RACETRACK_ID = "layer-racetrack";
      const locations = trackInfo.data.map((item: any[]) => item.slice(1, 3).reverse()) as [number, number][];
      const { colorGradientData, markers } = colorGradientGeneratorMap[2](trackInfo.data);

      (mapRef.current! as any).addSource(SOURCE_LINE_ID, {
        type: "geojson",
        lineMetrics: true,
        data: getLineGeoJSON(locations),
      });

      (mapRef.current! as any).addSource(SOURCE_RACETRACK_ID, {
        type: "geojson",
        lineMetrics: true,
        data: getLineGeoJSON(chunk(trackInfo.trackplan, 2).map((location: any[]) => location.reverse())),
      });

      // (mapRef.current! as any).addLayer({
      //   id: "bg",

      //   type: "fill",
      //   paint: {
      //     "fill-color": "#00ffff",
      //   },
      // });

      (mapRef.current! as any).addLayer({
        type: "line",
        source: SOURCE_RACETRACK_ID,
        id: LAYER_RACETRACK_ID,
        paint: {
          "line-color": "#ff0000",
          "line-width": 2,
        },
      });
      // the layer must be of type 'line'
      (mapRef.current! as any).addLayer(
        {
          type: "line",
          source: SOURCE_LINE_ID,
          id: LAYER_LINE_ID,
          paint: {
            // 'line-color': 'red',
            "line-width": 2,
            // 'line-gradient' must be specified using an expression
            // with the special 'line-progress' property
            "line-gradient": ["interpolate", ["linear"], ["line-progress"], ...colorGradientData],
          },
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
        },
        LAYER_RACETRACK_ID
      );

      // markers.forEach((marker) => {
      //   marker.addTo(mapRef.current!);
      // });
      // currentMarkers = markers;
    }
  }, [state.app.sa.trackInfo]);

  return (
    <>
      <div className=" w-full h-full bg-white map-wrapper" ref={mapContainerRef} />
    </>
  );
}
