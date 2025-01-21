import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "fridge magnets",
  description: "you passed by a cute little fridge on the internet and it has some magnets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
