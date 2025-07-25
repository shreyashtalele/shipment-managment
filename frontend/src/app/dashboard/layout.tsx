// app/dashboard/layout.tsx
"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar"; // Ensure this path is correct
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`${inter.className} flex min-h-screen bg-[#f9fafb] text-gray-900`}
    >
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-64"
        } p-10`}
      >
        {children}
      </main>
    </div>
  );
}
