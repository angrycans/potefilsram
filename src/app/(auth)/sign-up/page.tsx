"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useFormStatus } from "react-dom";
import { useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

import { signUpWithCredentials } from "@/app/lib/auth.actions";
import { signIn } from "@/auth";

const userSignUpValidation = z
  .object({
    // name: z.string().min(1, "Username is required").max(50, "Username must be less than 50 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z.string().min(1, "Password is required").min(8, "Password must be 8+ characters"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Password do not match",
  });

export default function SignUpForm() {
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(userSignUpValidation),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: any) {
    setPending(true);

    const ret = await signUpWithCredentials({ email: values.email, password: values.password });

    console.log(ret);
    setPending(false);
    if (ret.code) {
      form.reset();

      toast({
        title: `${values.email} user create success.`,
        // variant: "default",
      });
    } else {
      toast({
        title: ret.msg,
        // description: "Perhaps you signed up with another method?",
        variant: "destructive",
      });
    }

    // const ret = await new Promise((resolve, reject) => {
    //   setTimeout(() => {
    //     console.log(values);
    //     console.log("form", pending);
    //     setPending(false);
    //     resolve("Hello world!");
    //   }, 3000);
    // });
  }
  return (
    <div className="w-full h-svh ">
      <div className="flex h-full w-full items-center justify-center ">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(async (data) => await onSubmit(data))}>
            <div className="mx-auto grid w-[350px] gap-6">
              <div className="grid gap-2 text-center">
                <h1 className="text-3xl font-bold">Sign Up</h1>
                <p className="text-sm text-muted-foreground">Enter your email below to sign up your account</p>
              </div>
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? "Submitting..." : "Sign Up"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/sign-in" className="underline">
                  Sign In
                </Link>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
