import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Management System",
  description: "Stock & Production Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
