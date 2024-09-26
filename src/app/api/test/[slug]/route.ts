import { type NextRequest } from "next/server";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug; // 'a', 'b', or 'c'

  console.log("req", request);
  console.log("params", params);

  return new Response("User deleted successfully! id=" + slug, { status: 200 });
}
