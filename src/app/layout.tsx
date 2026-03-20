import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { CommandMenu } from "@/components/layout/command-menu";
import "./globals.css";

export const metadata: Metadata = {
  title: "Viyan — Personal Dashboard",
  description:
    "A self-hosted personal dashboard for productivity, finance tracking, and daily tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <CommandMenu />
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
