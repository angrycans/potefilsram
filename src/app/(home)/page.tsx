import HeroLanding from "@/components/sections/hero-landing";
import { getCurrentUser } from "@/lib/session";
import { auth } from "@/auth";
import { GetServerSidePropsContext } from "next";

// import { useSession } from "next-auth/react";

export default async function IndexHome({}) {
  const user = await getCurrentUser();

  console.log("IndexHome", user);

  // const session = useSession();

  // console.log("IndexHome session", session);

  return (
    <>
      <HeroLanding />
    </>
  );
}
