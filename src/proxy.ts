import { auth } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*"],
};

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== "/sign-in") {
    const newUrl = new URL("/sign-in", req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});
