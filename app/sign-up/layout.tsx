import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/auth-layout";

export const metadata: Metadata = {
  title: "Sign up — Ghost AI",
  description: "Create your Ghost AI workspace",
};

export default function AuthLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout mode="sign-up">{children}</AuthLayout>;
}
