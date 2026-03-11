import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlanIt Report AI",
  description: "Academy teacher report management tool. Generate Korean parent reports and teacher notes with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        {children}
      </body>
    </html>
  );
}
