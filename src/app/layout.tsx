import type { Metadata } from "next";
import "./globals.css";
import "@/styles/whatsapp-theme.css";
import { WhatsFlowProvider } from "@/lib/whatsflow-store";

export const metadata: Metadata = {
  title: "WhatsFlow - Centralized WhatsApp Business API Management Platform",
  description: "Manage your Meta / WhatsApp Business API credentials, flows, contacts, templates, and analytics all in one beautiful SaaS dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full bg-[var(--color-bg)] text-[var(--color-text)] antialiased selection:bg-zinc-800 selection:text-white">
        <WhatsFlowProvider>
          {children}
        </WhatsFlowProvider>
      </body>
    </html>
  );
}
