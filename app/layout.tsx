import Link from "next/link";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marxists Explorer",
  description: "Discover and explore the works of Marxist thinkers from around the world",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen bg-background text-foreground">
          <header className="border-b bg-background/80 backdrop-blur">
            <nav className="container mx-auto flex items-center justify-between px-4 py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                Marxists Explorer
              </Link>
              <div className="flex items-center gap-4 text-sm font-medium">
                <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
                  Home
                </Link>
                <Link
                  href="/visualizations"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Visualisations
                </Link>
              </div>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
