"use server";
import { redirect } from "next/navigation";
import * as bcrypt from "bcrypt-ts";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";
import { sign } from "crypto";
import { signIn, signOut } from "@/auth";
// import { signOut } from "next-auth/react";

export interface SignUpWithCredentialsParams {
  email: string;
  password: string;
}

/*
  const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true },
  emailVerified: { type: Date },
  image: { type: String },
  accounts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Account" }],
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Session" }],
  authenticators: [{ type: mongoose.Schema.Types.ObjectId, ref: "Authenticator" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

  */
export async function signUpWithCredentials({ email, password }: SignUpWithCredentialsParams) {
  console.log("signUpWithCredentials", email, password);

  try {
    // const ret = await signIn("resend", {
    //   email: email.toLowerCase(),
    //   redirect: false,
    //   callbackUrl: "/dashboard",
    // });

    // console.log("signUpWithCredentials email", ret);

    // return { code: 1, data: { email } };

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: hashedPassword,
    });
    console.log({ newUser });
    connectDB();

    const user = await User.findOne({ email });

    if (user) {
      throw new Error("User already exists.");
    }

    await newUser.save();

    return { code: 1, data: { email: newUser.email } };
  } catch (error) {
    //redirect(`/error?error=${(error as Error).message}`);
    return { code: 0, msg: (error as Error).message };
  }
}

export async function signInWithCredentials({ email, password }: SignUpWithCredentialsParams) {
  console.log("signInWithCredentials", email, password);

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    connectDB();

    const user = await User.findOne({ email });

    if (user) {
      const passwordIsValid = await bcrypt.compare(password, user.password);
      console.log("passwordIsValid", passwordIsValid);

      if (passwordIsValid) {
        console.log("user", user);
        // const signInResult = await signIn("resend", {
        //   email: email.toLowerCase(),
        //   redirect: false,
        //   callbackUrl: "/dashboard",
        // });

        // console.log("signInResult", signInResult);

        await signIn("credentials", { email, name: user.name, image: user.image, redirect: false });
        return { code: 1 };
      }
    }
    return { code: 0, msg: "User or Password error!" };
  } catch (error) {
    //redirect(`/error?error=${(error as Error).message}`);
    return { code: 0, msg: (error as Error).message };
  }
}

export async function signOutClient() {
  await signOut({ redirect: true, redirectTo: "/" });
}
