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
      </head>
      <body className="h-full bg-[var(--color-bg)] text-[var(--color-text)] antialiased selection:bg-zinc-800 selection:text-white">
        <WhatsFlowProvider>
          {children}
        </WhatsFlowProvider>
      </body>
    </html>
  );
}
