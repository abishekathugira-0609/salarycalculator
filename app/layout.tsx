import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Know Your Pay",
    default: "Salary After Tax Calculator – 2026 | Know Your Pay",
  },
  description: "Calculate your 2026 take-home pay after federal and state taxes. Free US salary calculator.",
};

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://know-your-pay.com/#organization",
      name: "Know Your Pay",
      url: "https://know-your-pay.com",
      description: "Free US salary and tax calculator covering all 50 states, updated for 2026.",
    },
    {
      "@type": "WebSite",
      "@id": "https://know-your-pay.com/#website",
      url: "https://know-your-pay.com",
      name: "Know Your Pay",
      publisher: { "@id": "https://know-your-pay.com/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://know-your-pay.com/calculator?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_SCHEMA) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NavBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
