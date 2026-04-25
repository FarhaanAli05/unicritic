import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import { CountryProvider } from "@/components/CountryProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unicritic",
  description: "All ratings in one place. IMDb, Rotten Tomatoes, Metacritic, and more.",
  openGraph: {
    title: "Unicritic",
    description: "All ratings in one place. IMDb, Rotten Tomatoes, Metacritic, and more.",
    url: "https://unicritic.app",
    siteName: "Unicritic",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country") || "US";

  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased`}>
        <CountryProvider initialCountry={country}>{children}</CountryProvider>
      </body>
    </html>
  );
}
