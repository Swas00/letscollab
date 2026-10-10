import type { Metadata } from "next";
import "./tailwind-built.css";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";

export const metadata: Metadata = {
  title: "NeoStats | Collaborative Project Management Platform",
  description:
    "Real-time multi-user collaborative platform with RBAC, optimistic concurrency conflict detection, and live synchronization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-[#090a0f] text-zinc-100 min-h-screen">
        <AuthProvider>
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
