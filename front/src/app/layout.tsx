import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { SiteHeader } from "~/app/_components/site-header";

export const metadata: Metadata = {
  title: "Bookshop",
  description: "Microservices Bookshop UI",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <div className="min-h-dvh">
            <SiteHeader />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </div>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
