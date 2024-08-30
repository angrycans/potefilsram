import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug; // 'a', 'b', or 'c'

  try {
    // Fetch the array buffer from the external URL
    //  const response = await fetch("https://utfs.io/f/4396c479-e58b-4f91-b240-902d97e240e9-dd8yk.sa");

    const response = await fetch("https://utfs.io/f/c7746002-56f9-448b-ab7c-1bcd248b5631-nvbnc4.5-101323-R3.sa");
    // Check if the fetch was successful
    if (!response.ok) {
      throw new Error("Failed to fetch the file.");
    }

    // Convert the response to an array buffer
    const buffer = await response.arrayBuffer();

    // Decode the array buffer to a UTF-8 string
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(buffer);

    // Return the decoded text as JSON
    return NextResponse.json({ code: 1, data: text }, { status: 200 });
  } catch (error) {
    console.error("Error fetching or decoding the file:", error);

    // Return an error response in case of an exception
    return NextResponse.json({ code: 0, error: "Error decoding text" }, { status: 500 });
  }
}
