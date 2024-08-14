"use server";
import fs from "node:fs/promises";
import { revalidatePath } from "next/cache";

export async function uploadFile(formData: FormData) {
  console.log("uploadFile", formData);

  const file = formData.get("file") as File;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  await fs.writeFile(`./.uploads/${file.name}`, buffer);

  revalidatePath("/");

  console.log("uploadFile ok");
}
