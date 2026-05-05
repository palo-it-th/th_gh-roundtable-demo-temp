import type { Metadata } from "next";
import { Fira_Code, Inter } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/components/providers/role-provider";
import { RoleSelector } from "@/components/role-selector";
import { Sidebar } from "@/components/sidebar";

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AML Case Management",
  description: "AML/STR Case Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${firaCode.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-screen flex-col bg-surface-base text-text-primary">
        <RoleProvider>
          <header
            className="flex h-14 shrink-0 items-center justify-between border-b border-card-border bg-surface-editor px-5"
            data-testid="app-header"
          >
            <h1 className="font-mono text-lg font-bold text-primary">
              AML Case Management
            </h1>
            <RoleSelector />
          </header>
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
