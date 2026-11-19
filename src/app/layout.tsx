import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AttendX Web — Bunk Smart, Stay Eligible",
  description: "Next-gen attendance prediction, safe bunk calculator, and MT2 eligibility forecast.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/icon.png" />
      </head>
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
