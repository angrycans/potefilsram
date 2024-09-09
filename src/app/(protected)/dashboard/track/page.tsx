"use client";

import { constructMetadata } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

import { DashboardHeader } from "@/components/dashboard/header";
import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { TrackInfo } from "@/components/tracks/track_info";
import { TrackMap } from "@/components/tracks/track_map";
import { TrackValue } from "@/components/tracks/track_value";

export default function TrackPage() {
  const default_Layout = [25, 35];
  const md_default = [];
  return (
    <PanelGroup autoSaveId="TrackPage" direction="horizontal" className="w-full  h-full ">
      <Panel defaultSize={25} minSize={25} className="hidden md:block">
        <div className="">
          <TrackInfo />
        </div>
      </Panel>
      <PanelResizeHandle />
      <Panel className="h-full w-full" defaultSize={75}>
        <PanelGroup autoSaveId="example" direction="vertical">
          <Panel defaultSize={40} className="block md:hidden h-full w-full">
            <div className=" h-full bg-gray-500">a</div>
          </Panel>
          <PanelResizeHandle className="block md:hidden" />
          <Panel defaultSize={50}>
            <TrackMap />
          </Panel>
          <PanelResizeHandle />
          <Panel defaultSize={50}>
            <TrackValue />
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}
