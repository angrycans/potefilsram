"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";

export default function Home() {
  const session = useSession();

  console.log("useSession", session);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-red-700">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex bg-red-500">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 from-zinc-200 pb-6 pt-8  lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-red-300 lg:p-4 lg:dark:bg-zinc-800/30">
          Get started
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center  lg:static lg:size-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            rel="noopener noreferrer"
          >
            By <Image src="/logo.png" alt="logo" width={100} height={24} priority />
          </a>
        </div>
      </div>

      <div className="relative z-[-1] flex w-full h-full items-end justify-center">
        <Image className="relative " src="/view.svg" alt="Logo" width={180} height={37} priority />
      </div>
    </main>
  );
}
