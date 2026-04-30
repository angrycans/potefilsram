import HeroLanding from "@/components/sections/hero-landing";
import { getCurrentUser } from "@/lib/session";

export default async function IndexHome({}) {
  const user = await getCurrentUser();

  return (
    <>
      <HeroLanding />
    </>
  );
}
