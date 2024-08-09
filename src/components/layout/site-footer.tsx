import * as React from "react";

import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/layout/mode-toggle";

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("border-t", className)}>
      <div className="container flex max-w-6xl h-16 justify-center items-center text-sm">
        Design by angrycans@gmail.com Copyright &copy; 2024.
        <div className="p-4">
          <ModeToggle />
        </div>
      </div>
    </footer>
  );
}
