"use client";
import { Children, useState } from "react";
import { FileUploader, FileUploaderContent, FileUploaderItem, FileInput } from "./file-upload";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { uploadFile } from "@/app/lib/uploadfile.action";

import { useUploadThing } from "@/components/uploadthing/uploadthinger";
const FileSvgDraw = () => {
  //console.log("FileSvgDraw files", value);

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
        &nbsp; or drag and drop file
      </p>
    </>
  );
};

export const FormFileUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[] | null>(null);
  const { toast } = useToast();
  const dropZoneConfig = {
    maxFiles: 1,
    maxSize: 1024 * 1024 * 4,
    multiple: false,
  };

  const { startUpload } = useUploadThing("saUploader", {
    onClientUploadComplete: () => {
      setUploading(false);
      setFiles(null);
      console.log("uploaded successfully!");
    },
    onUploadProgress: (p) => {
      console.log("onUploadProgress", p);
    },
    onUploadError: (error) => {
      setUploading(false);
      toast({
        title: "Some things wrong.",
        description: error.message,
        variant: "destructive",
      });
    },
    onUploadBegin: () => {
      setUploading(true);
      console.log("upload has begun");
    },
  });

  return (
    <FileUploader
      value={files}
      onValueChange={(file) => {
        console.log("onValueChange 1", file);
        if (file && file[0] && file[0].name.endsWith(".sa")) {
          setFiles(file);
          startUpload(file as File[])
            .then((response) => {
              // Handle the response from the server
              console.log("uploadFile", response);
            })
            .catch((error) => {
              // Handle the error
              console.log("uploadFile error", error);
            });
        } else {
          if (file && file[0]) {
            toast({
              title: "Please add .sa file.",
              //description: ret.msg,
              variant: "destructive",
            });
          } else {
            setFiles(file);
          }
        }

        // console.log("onValueChange", file[0].name.endsWith(".sa"));
        // if (file && file[0] && file[0].name.endsWith(".sa")) {
        //   console.log("FormFileUploader upload");

        //   const formData = new FormData();
        //   formData.append("file", file[0]);

        //   uploadFile(formData)
        //     .then((response) => {
        //       // Handle the response from the server
        //       console.log("uploadFile", response);
        //     })
        //     .catch((error) => {
        //       // Handle the error
        //       console.log("uploadFile error", error);
        //     });
        // }

        //setFiles(file);
      }}
      dropzoneOptions={dropZoneConfig}
      className=" bg-background rounded-lg p-2 h-full"
    >
      <FileInput className="outline-dashed outline-1 outline-white h-full">
        <div className="flex items-center justify-center flex-col pt-3 pb-4 w-full h-full">
          <FileSvgDraw />

          <button
            type="button"
            className="mt-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
          >
            {uploading ? (
              <>
                <svg
                  aria-hidden="true"
                  role="status"
                  className="inline w-4 h-4 me-3 text-white animate-spin"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="#E5E7EB"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentColor"
                  />
                </svg>
                uploading...
              </>
            ) : (
              "Add .Sa File"
            )}
          </button>

          <FileUploaderContent className="p-2">
            {files &&
              files.length > 0 &&
              files.map((file, i) => (
                <FileUploaderItem key={i} index={i}>
                  <Paperclip className="h-4 w-4 stroke-current" />
                  <span>{file.name}</span>
                </FileUploaderItem>
              ))}
          </FileUploaderContent>
        </div>
      </FileInput>
    </FileUploader>
  );
};
