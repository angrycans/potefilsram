import { authApiMiddleware } from "@/lib/authApiMiddleware";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("req", req);
  const session = await authApiMiddleware(req);

  if (!session) {
    // return new Response("API test err ", { status: 401 });
    return NextResponse.redirect(new URL("/401", req.url));
  } else {
    return new Response("API test ok", { status: 200 });
  }
}
