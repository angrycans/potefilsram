import HeroLanding from "@/components/sections/hero-landing";
import { useSession } from "next-auth/react";

export default function IndexHome() {
  // const session = useSession();

  // console.log("IndexHome session", session);
  return (
    <>
      <HeroLanding />
    </>
  );
}
