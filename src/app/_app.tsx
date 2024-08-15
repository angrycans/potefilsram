import React, { useEffect } from "react";
import type { AppProps } from "next/app";
import "../styles/globals.css"; // Assuming you have a global CSS file

import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

// export async function getServerSideProps(ctx: any) {
//   const session = await auth(ctx);

//   return {
//     props: {
//       session,
//     },
//   };
// }

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // useEffect(() => {
  //   document.documentElement.classList.add("dark");
  //   console.log("app init");
  // }, []);

  return (
   // <SessionProvider session={session}>
      <Component {...pageProps} />;
  //  </SessionProvider>
  );
}

export default App;
