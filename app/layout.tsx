import type { Metadata, Viewport } from "next";
import "./globals.css";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Alam Memanggil",
  description: "Jawab Panggilan, Taklukkan Alam!",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="overflow-x-hidden">
      <body className="min-h-screen overflow-x-hidden antialiased bg-white text-neutral-900">
        <Providers>
          <div className="min-h-screen flex flex-col overflow-x-hidden">
            <Header />

            <main className="flex-1 w-full min-w-0 overflow-x-hidden">
              {children}
            </main>

            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}