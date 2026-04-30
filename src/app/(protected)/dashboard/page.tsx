"use client";

import Image from "next/image";
import { DashboardHeader } from "@/components/dashboard/header";
import { FormFileUploader } from "@/components/file-upload/file-uploader";

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader heading="Dashboard" text={`Current Role : — Change your role in settings.`} />

      <div className="">
        <div className="mx-auto max-w-2xl px-4 py-1 sm:px-6 sm:py-2 lg:max-w-7xl lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">My track data</h2>

          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            <div className="group relative">
              <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-h-7 xl:aspect-w-7">
                <Image
                  src="https://tailwindui.com/img/ecommerce-images/category-page-04-image-card-01.jpg"
                  alt="Front of men&#039;s Basic Tee in black."
                  width={800}
                  height={800}
                  className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                />
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-gray-700">
                    <a href="#">
                      <span aria-hidden="true" className="absolute inset-0"></span>
                      Basic Tee
                    </a>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">Black</p>
                </div>
                <p className="text-sm font-medium text-gray-900">$35</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-full w-full items-center justify-center">
        <div className="flex w-[400px] h-[250px] flex-col items-center text-center">
          <FormFileUploader />
        </div>
      </div>
    </>
  );
}
