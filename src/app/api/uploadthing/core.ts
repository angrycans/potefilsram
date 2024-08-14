import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getCurrentUser } from "@/lib/session";

import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

//FileRouterInputConfig;

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  saUploader: f({
    blob: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async (data) => {
      // This code runs on your server before upload
      console.log("middleware", data.files[0].name);
      if (!(data.files[0] as any).name.endsWith(".sa")) {
        throw new UploadThingError("File suffix must be .sa");
      }

      const user = await getCurrentUser();
      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.email };
    })
    .onUploadComplete((data) => {
      console.log("upload completed", data);
    }),
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const user = await getCurrentUser();
      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.url);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
