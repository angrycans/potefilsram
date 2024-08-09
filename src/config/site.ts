import { SidebarNavItem, SiteConfig } from "@/types";
import { env } from "@/env.mjs";

const site_url = env.NEXT_PUBLIC_APP_URL;

export const siteConfig: SiteConfig = {
  name: "Mars Life Starter",
  description: "Mars Life Starter",
  url: site_url,
  ogImage: `${site_url}/_static/og.jpg`,
  links: {
    twitter: "https://twitter.com/angrycans",
    github: "https://github.com/angrycans",
  },
  mailSupport: "angrycans@gmail.com",
};
