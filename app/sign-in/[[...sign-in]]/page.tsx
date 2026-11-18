import { SignIn } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        theme: shadcn,
        variables: {
          colorPrimary: "var(--accent-primary)",
          colorBackground: "var(--bg-elevated)",
          colorForeground: "var(--text-primary)",
          colorMutedForeground: "var(--text-muted)",
          colorInput: "var(--bg-surface)",
          colorInputForeground: "var(--text-primary)",
          colorBorder: "var(--border-default)",
          colorRing: "var(--accent-primary)",
          borderRadius: "0.75rem",
        },
        elements: {
          rootBox: "w-full",
          cardBox: "w-full",
          card: "!border-0 !bg-transparent !p-0 !shadow-none",
          headerTitle: "sr-only",
          headerSubtitle: "sr-only",
          formButtonPrimary: "font-medium",
          footerActionLink: "text-accent-primary hover:text-accent-primary/80",
        },
      }}
    />
  );
}
