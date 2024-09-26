import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: [
    //  "/((?!api|_next/static|_next/image|favicon.ico).*)"
    "/dashboard/:path*",
  ],
};

// export function middleware(request: NextRequest) {
//   console.log("middleware", request.url);
//   // if (res)
//   // return NextResponse.redirect(new URL("/401", request.url));

//   return NextResponse.next();
// }

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== "/sign-in") {
    const newUrl = new URL("/sign-in", req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});
