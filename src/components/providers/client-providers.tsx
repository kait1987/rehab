"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
        {children}
      </ThemeProvider>
    </ClerkProvider>
  );
}

