"use client";
import { useState } from "react";
import { FileUploader, FileUploaderContent, FileUploaderItem, FileInput } from "./file-upload";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { uploadFile } from "@/app/lib/uploadfile.action";

import { useUploadThing } from "@/components/uploadthing/uploadthinger";
const FileSvgDraw = () => {
  return (
    <>
      <svg
        className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 16"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
        />
      </svg>
      <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
        <span className="font-semibold">Click to upload</span>
        &nbsp; or drag and drop .sa file
      </p>
      <Button className="text-xs mt-5">Add .Sa File</Button>
    </>
  );
};

export const FormFileUploader = () => {
  const [files, setFiles] = useState<File[] | null>(null);
  const { toast } = useToast();
  const dropZoneConfig = {
    maxFiles: 1,
    maxSize: 1024 * 1024 * 4,
    multiple: false,
  };

  const { startUpload } = useUploadThing("saUploader", {
    onClientUploadComplete: () => {
      alert("uploaded successfully!");
    },
    onUploadError: () => {
      alert("error occurred while uploading");
    },
    onUploadBegin: () => {
      alert("upload has begun");
    },
  });

  return (
    <FileUploader
      value={files}
      onValueChange={(file) => {
        console.log("onValueChange 1", file);
        startUpload(file as File[])
          .then((response) => {
            // Handle the response from the server
            console.log("uploadFile", response);
          })
          .catch((error) => {
            // Handle the error
            console.log("uploadFile error", error);
          });

        return;

        // console.log("onValueChange", file[0].name.endsWith(".sa"));
        if (file && file[0] && file[0].name.endsWith(".sa")) {
          console.log("FormFileUploader upload");

          const formData = new FormData();
          formData.append("file", file[0]);

          uploadFile(formData)
            .then((response) => {
              // Handle the response from the server
              console.log("uploadFile", response);
            })
            .catch((error) => {
              // Handle the error
              console.log("uploadFile error", error);
            });
        }

        //setFiles(file);
      }}
      dropzoneOptions={dropZoneConfig}
      className=" bg-background rounded-lg p-2 h-full"
    >
      <FileInput className="outline-dashed outline-1 outline-white h-full">
        <div className="flex items-center justify-center flex-col pt-3 pb-4 w-full h-full">
          <FileSvgDraw />
        </div>
      </FileInput>
      <FileUploaderContent>
        {files &&
          files.length > 0 &&
          files.map((file, i) => (
            <FileUploaderItem key={i} index={i}>
              <Paperclip className="h-4 w-4 stroke-current" />
              <span>{file.name}</span>
            </FileUploaderItem>
          ))}
      </FileUploaderContent>
    </FileUploader>
  );
};
