import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THEMATHINK - 哲学级思考助手",
  description: "通过提问帮助你发现自己是谁",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
