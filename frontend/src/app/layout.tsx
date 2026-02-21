import type { Metadata } from "next";
import TopNav from "@/components/top-nav";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workflow Platform",
  description: "Workflow platform frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="app-shell">
          <ToastProvider>
            <TopNav />
            <div className="app-main">{children}</div>
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}
