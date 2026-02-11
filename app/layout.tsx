import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import LicensePrompt from "@/components/LicensePrompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Construction Management System",
  description: "Enterprise-grade construction management software",
  generator: "v0.dev",
  themeColor: "#0d6efd",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d6efd" />
        <link
          rel="apple-touch-icon"
          href="https://i.postimg.cc/N0Dfx7pC/Your-paragraph-text.png"
        />
        <Script
          src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBqN9hRjfX8lPhARFr6n8MoolSUqcl6WHc&libraries=places"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* <LicensePrompt /> */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}











