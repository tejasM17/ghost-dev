import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Sign in — Ghost dev",
  description: "Sign in to your Ghost dev workspace",
};

export default function AuthLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout signUpHref="/sign-up">{children}</AuthLayout>;
}
