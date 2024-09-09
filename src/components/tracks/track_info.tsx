"use client";
import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function TrackInfo({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <div className="flex max-w-100 max-h-48 bg-white">
      {/* <div className="container flex max-w-6xl h-16 justify-center items-center text-sm">a</div> */}
      <div className="flex-row bg-gray-100 w-1/2">
        <div>speed 100kmh</div>
        <div>section 1</div>
        <div>lap 1</div>
      </div>
      <div className="flex-row bg-gray-300 w-1/2">
        <div className="">sss</div>
        <div className="">map2</div>
      </div>
    </div>
  );
}
