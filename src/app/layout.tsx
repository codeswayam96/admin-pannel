import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { MobileSidebar } from "@/components/MobileSidebar";
import { AdminCommandPalette } from "@/components/AdminCommandPalette";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CodeSwayam Admin Panel",
  description: "Manage users, blogs, and SaaS products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased flex min-h-screen bg-muted/30`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="hidden lg:flex">
            <Sidebar />
          </div>
          <MobileSidebar />
          <AdminCommandPalette />
          <main className="flex-1 overflow-auto">
            <div className="pt-16 lg:pt-0 p-4 lg:p-8 max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
