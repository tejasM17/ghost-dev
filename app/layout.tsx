import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ghost dev",
  description: "Real-time collaborative system design workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          appearance={{
            theme: dark,
            // Hide Clerk "Development mode" notice + "Secured by clerk" footer branding.
            // True production keys also drop the dev notice; this keeps deployed UI clean
            // even while using development instances / free-plan branding flags.
            options: {
              unsafe_disableDevelopmentModeWarnings: true,
            },
            elements: {
              footerItem: { display: "none" },
            },
            variables: {
              colorBackground: "var(--bg-surface)",
              colorInput: "var(--bg-elevated)",
              colorInputForeground: "var(--text-primary)",
              colorForeground: "var(--text-primary)",
              colorPrimary: "var(--accent-primary)",
              colorPrimaryForeground: "var(--bg-base)",
              colorMutedForeground: "var(--text-muted)",
              colorNeutral: "var(--text-secondary)",
              colorBorder: "var(--border-default)",
              colorRing: "var(--accent-primary)",
              colorModalBackdrop: "var(--bg-base)",
              colorShimmer: "var(--bg-subtle)",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
