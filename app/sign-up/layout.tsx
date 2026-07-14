import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Sign up — Ghost dev",
  description: "Create your Ghost dev workspace",
};

export default function AuthLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout signUpHref="/sign-in">{children}</AuthLayout>;
}
