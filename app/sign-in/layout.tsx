import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Sign in — Ghost AI",
  description: "Sign in to your Ghost AI workspace",
};

export default function AuthLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout mode="sign-in">{children}</AuthLayout>;
}
