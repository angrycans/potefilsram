"use client";

import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard/header";
import { EmptyPlaceholder } from "@/components/shared/empty-placeholder";
import { FormFileUploader } from "@/components/file-upload/file-uploader";
import { useSession } from "next-auth/react";

import { UploadButton, UploadDropzone } from "@/components/uploadthing/uploadthinger";

// import { useUploadThing } from "@/components/file-upload/utils/useUploadThing";
import { model } from "mongoose";

// import "@uploadthing/react/styles.css";

export default function DashboardPage() {
  const session = useSession();

  console.log("DashboardPage session", session);

  // const user = await getCurrentUser();

  // console.log("currentuser", user);

  return (
    <>
      <DashboardHeader heading="Dashboard" text={`Current Role : — Change your role in settings.`} />
      {/* <UploadDropzone
        className="flex rounded-lg outline-dashed outline-1 outline-white max-w-[420px] h-[280px] flex-col ut-label:text-lg ut-allowed-content:ut-uploading:text-red-300"
        content={{
          button(status) {
            console.log("status", status);
            //  if (status.ready) return <div>Add .Sa File</div>;

            return "Getting ready...";
          },
          allowedContent({ ready, fileTypes, isUploading }) {
            console.log("fileTypes", fileTypes);
            if (!ready) return "Checking what you allow";
            if (isUploading) return "stuff is uploading...";
            return `Stuff you can upload: .sa`;
          },

          //  uploadIcon: { color: "#a1a1aa" },
        }}
        //endpoint="imageUploader"
        endpoint="saUploader"
        // onBeforeUploadBegin={(files) => {
        //   // Preprocess files before uploading (e.g. rename them)
        //   return files.map((f) => new File([f], "renamed-" + f.name, { type: f.type }));
        // }}
        //config={{ mode: "auto" }}
        onClientUploadComplete={(res) => {
          // Do something with the response
          console.log("Files: ", res);
          console.log("Upload Completed");
        }}
        onUploadError={(error: Error) => {
          console.log("onUploadError error", error);
          alert(`ERROR! ${error}`);
        }}
        onUploadBegin={(name) => {
          // Do something once upload begins
          console.log("Uploading: ", name);
        }}
        onDrop={(acceptedFiles) => {
          // Do something with the accepted files
          console.log("Accepted files: ", acceptedFiles);
        }}
      /> */}
      <div className="flex max-w-[420px] h-[300px] flex-col items-center text-center">
        <FormFileUploader />
      </div>

      {/* <EmptyPlaceholder>
        <EmptyPlaceholder.Icon name="post" />
        <EmptyPlaceholder.Title>No content created</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          You don&apos;t have any content yet. Start creating content.
        </EmptyPlaceholder.Description>
        <Button>Add Content</Button>
      </EmptyPlaceholder> */}
    </>
  );
}
