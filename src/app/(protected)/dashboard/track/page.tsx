"use client";

import { constructMetadata } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

import { LineChartMultiple } from "@/components/charts/line-chart-multiple";

import { DashboardHeader } from "@/components/dashboard/header";
import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { TrackInfo } from "@/components/tracks/track_info";

export default function TrackPage() {
  return (
    <PanelGroup autoSaveId="TrackPage" direction="horizontal" className="w-full  h-full ">
      <Panel defaultSize={25} minSize={25} className="hidden md:block">
        <div className="">
          <TrackInfo />
        </div>
      </Panel>
      <PanelResizeHandle />
      <Panel className="w-1/2  h-full">
        <PanelGroup autoSaveId="example" direction="vertical">
          <Panel className="block md:hidden">
            <div className=" h-full bg-gray-500">a</div>
          </Panel>
          <PanelResizeHandle className="block md:hidden" />
          <Panel>
            <div className="h-full bg-red-200">b</div>
          </Panel>
          <PanelResizeHandle />
          <Panel defaultSize={25}>
            <div className="h-full bg-green-200">cd</div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}
