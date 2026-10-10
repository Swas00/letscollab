import type { Metadata } from "next";
import "./tailwind-built.css";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";

export const metadata: Metadata = {
  title: "LetsCollab | Real-Time Collaborative Workspace & Project Platform",
  description:
    "Real-time multi-user collaborative platform with RBAC, optimistic concurrency conflict detection, and live synchronization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-paper text-carbon min-h-screen">
        <AuthProvider>
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
