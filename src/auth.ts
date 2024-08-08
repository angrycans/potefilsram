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

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  debug: process.env.NODE_ENV === "development",

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
  ],
});
