import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { DashboardProvider } from "@/context/DashboardContext";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

import "./globals.css";
import "@/lib/suppress-warnings";

// Use system fonts as fallback to avoid network issues during build
const fontClass = "font-sans";

export const metadata: Metadata = {
  title: "Insurance CRM",
  description: "Personal Insurance Agent CRM System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontClass} antialiased`}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            <AuthProvider>
              <DashboardProvider>
                {children}
                <Toaster />
              </DashboardProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
