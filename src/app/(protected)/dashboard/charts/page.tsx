import { constructMetadata } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

import { DashboardHeader } from "@/components/dashboard/header";
import { useState } from "react";

export const metadata = constructMetadata({
  title: "Track Charts – Mars life starter",
  description: "",
});

export default function ChartsPage() {
  return (
    <>
      <DashboardHeader heading="Track" text="track data" />

      <div className="grid grid-cols-1 gap-4"></div>
    </>
  );
}
