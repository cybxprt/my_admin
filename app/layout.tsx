import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SunnahOS Universal Network Center",
    template: "%s | SunnahOS",
  },
  description: "A unified workspace for DNS, IP addressing, network tools, infrastructure references and authorized defensive operations.",
  applicationName: "SunnahOS Network Center",
  metadataBase: new URL("https://sunnahos-network-center.vercel.app"),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
