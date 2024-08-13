import NextAuth from "next-auth";
import { ZodError } from "zod";
import Credentials from "next-auth/providers/credentials";
import type { PrismaClient, Prisma } from "@prisma/client";
import type { Adapter, AdapterAccount, AdapterSession, AdapterUser } from "@auth/core/adapters";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { signInWithCredentials } from "./app/lib/auth.actions";
import GoogleProvider from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { env } from "@/env.mjs";
import { Provider } from "@radix-ui/react-toast";
import { MongooseAdapter } from "@brendon1555/authjs-mongoose-adapter";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  debug: process.env.NODE_ENV === "development",
  adapter: MongooseAdapter(env.DATABASE_URL),
  providers: [
    Credentials({
      authorize: async (credentials) => {
        try {
          console.log("signin Credentials authorize", credentials);

          return { email: credentials.email };
        } catch (error) {
          if (error instanceof ZodError) {
            // Return `null` to indicate that the credentials are invalid

            return null;
          }
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    // Resend({
    //   server: process.env.EMAIL_SERVER,
    //   from: process.env.EMAIL_FROM,
    //   sendVerificationRequest({ identifier: email, url, provider: { server, from } }) {
    //     // your function
    //   },
    // }),
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      // sendVerificationRequest,
    }),
  ],
});
