// lib/authMiddleware.js
import { auth } from "@/auth";
import { getSession } from "next-auth/react";
import { NextRequest, NextResponse } from "next/server";
export const authApiMiddleware = async (req: NextRequest) => {
  //const session = await getSession({ req: any });

  const session = await auth();

  console.log("session", session);
  if (!session) {
    return false; // Not authenticated
  }
  return session; // Authenticated
};
