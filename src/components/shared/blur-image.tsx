"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export default function BlurImage(props: ComponentProps<typeof Image>) {
  const [isLoading, setLoading] = useState(true);

  //console.log("BlurImage", { ...props });
  const props1 = {
    ...props,
  };

  // if ()
  delete props1.placeholder;

  return (
    <Image
      {...props1}
      alt={props.alt}
      className={cn(props.className, "duration-500 ease-in-out", isLoading ? "blur-sm" : "blur-0")}
      onLoad={() => setLoading(false)}
    />
  );
}
