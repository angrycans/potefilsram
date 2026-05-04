"use server";
import * as bcrypt from "bcrypt-ts";
import { signIn, signOut } from "@/auth";
import { createUser, getUserByEmail } from "@/lib/user-store";

export interface SignUpWithCredentialsParams {
  email: string;
  password: string;
}
export async function signUpWithCredentials({ email, password }: SignUpWithCredentialsParams) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await createUser({
      email,
      passwordHash: hashedPassword,
    });

    // 注册成功后自动登录
    await signIn("credentials", { email: user.email, password, redirect: false });

    return { code: 1, data: { email: user.email } };
  } catch (error) {
    return { code: 0, msg: (error as Error).message };
  }
}

export async function signInWithCredentials({ email, password }: SignUpWithCredentialsParams) {
  try {
    const user = await getUserByEmail(email);

    if (!user?.passwordHash) {
      return { code: 0, msg: "User or Password error!" };
    }

    const passwordIsValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordIsValid) {
      return { code: 0, msg: "User or Password error!" };
    }

    await signIn("credentials", { email: user.email, password, redirect: false });
    return { code: 1 };
  } catch (error) {
    return { code: 0, msg: (error as Error).message };
  }
}

export async function signOutClient() {
  await signOut({ redirect: true, redirectTo: "/" });
}
