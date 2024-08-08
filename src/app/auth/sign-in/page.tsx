"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { signInWithCredentials } from "@/app/lib/auth.actions";
import { PasswordInput } from "@/components/ui/password-input";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export const userSignInValidation = z.object({
  // name: z.string().min(1, "Username is required").max(50, "Username must be less than 50 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export default function SignInForm() {
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof userSignInValidation>>({
    resolver: zodResolver(userSignInValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit_nextauth(values: z.infer<typeof userSignInValidation>) {
    setPending(true);
    startTransition(async () => {
      try {
        const ret = await signInWithCredentials({
          email: values.email,
          password: values.password,
        });

        if (ret.code) {
          toast({
            title: "User sign in .",
          });
          router.push("/dashboard");
        } else {
          toast({
            title: "Something went wrong",
            description: ret.msg,
            variant: "destructive",
          });
        }
        setPending(false);
      } catch (error) {
        console.error(error);
        setPending(false);
        toast({
          title: "Something went wrong",
          description: "Please try again",
          variant: "destructive",
        });
      }
    });
  }

  async function onSubmit(values: z.infer<typeof userSignInValidation>) {
    console.log("SignInForm onSubmit ");
    setPending(true);

    const ret = await signInWithCredentials({ email: values.email, password: values.password });

    console.log(ret);
    setPending(false);
    if (ret.code) {
      form.reset();

      toast({
        title: `${values.email} user sign in success.`,
        // variant: "default",
      });
    } else {
      toast({
        title: ret.msg,
        // description: "Perhaps you signed up with another method?",
        variant: "destructive",
      });
    }
  }
  return (
    <div className="w-full h-svh lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="mx-auto w-full h-full bg-blue-500 hidden lg:block">left-div</div>
      <div className="flex h-full w-full items-center justify-center ">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(async (data) => await onSubmit_nextauth(data))}>
            <div className="mx-auto grid w-[350px] gap-6">
              <div className="grid gap-2 text-center">
                <h1 className="text-3xl font-bold">Login</h1>
                <p className="text-sm text-muted-foreground">Enter your email below to login to your account</p>
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
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center">
                          <FormLabel>Password</FormLabel>
                          <Link href="/forgot-password" className="ml-auto inline-block text-sm underline">
                            Forgot your password?
                          </Link>
                        </div>
                        <FormControl>
                          <PasswordInput {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? "Submitting..." : "Sign In"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("signIn google");
                    signIn("google");
                  }}
                  className="w-full"
                >
                  Login with Google
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="underline">
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
