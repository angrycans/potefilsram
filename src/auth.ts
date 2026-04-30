import NextAuth from "next-auth";
import { ZodError } from "zod";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import * as bcrypt from "bcrypt-ts";
import { getUserByEmail, upsertOAuthUser } from "@/lib/user-store";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  debug: process.env.NODE_ENV === "development",
  providers: [
    Credentials({
      authorize: async (credentials: any) => {
        try {
          const email = credentials?.email;
          const password = credentials?.password;

          if (!email || !password) {
            return null;
          }

          const user = await getUserByEmail(email);

          if (!user?.passwordHash) {
            return null;
          }

          const passwordIsValid = await bcrypt.compare(password, user.passwordHash);

          if (!passwordIsValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          } as any;
        } catch (error) {
          if (error instanceof ZodError) {
            return null;
          }

          return null;
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
    // Resend({
    //   apiKey: env.RESEND_API_KEY,
    //   from: env.EMAIL_FROM,
    //   // sendVerificationRequest,
    // }),
  ],
  callbacks: {
    signIn: async ({ user, account }) => {
      if (account?.provider === "google" && user.email) {
        const storedUser = await upsertOAuthUser({
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: new Date().toISOString(),
        });

        user.id = storedUser.id;
        (user as any).role = storedUser.role;
      }

      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
        token.role = ((user as any).role ?? token.role ?? "USER") as any;
      }

      if (!token.role && token.email) {
        const storedUser = await getUserByEmail(token.email);
        token.role = storedUser?.role ?? "USER";
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.role = (token.role ?? "USER") as any;
      }

      return session;
    },
    authorized: async ({ auth }) => {
      return !!auth;
    },
  },
});
