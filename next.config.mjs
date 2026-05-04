import { withContentlayer } from "next-contentlayer2";
import("./src/env.mjs");


/** @type {import("next").NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
    reactStrictMode: true,
    pageExtensions: ["tsx", "mdx", "ts", "js"],
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "avatars.githubusercontent.com",
        },
        {
          protocol: "https",
          hostname: "lh3.googleusercontent.com",
        },
        {
          protocol: "https",
          hostname: "uploadthing.com",
        },
        {
          protocol: "https",
          hostname: "tailwindui.com",
        },
      ],
    },
  };



export default withContentlayer(nextConfig);
