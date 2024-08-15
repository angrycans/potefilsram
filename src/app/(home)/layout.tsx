import { NavBar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { NavMobile } from "@/components/layout/mobile-nav";

interface MarketingLayoutProps {
  children: React.ReactNode;
}
import { SessionProvider } from "next-auth/react";

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen flex-col">
        <NavMobile />
        <NavBar scroll={true} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </SessionProvider>
  );
}
