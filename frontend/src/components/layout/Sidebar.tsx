"use client";

import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const router = useRouter();

  return (
    <aside
      className={`fixed left-0 top-0 z-20 h-screen bg-white p-6 shadow-md transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="mb-10 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            TrackFast
          </h1>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="space-y-3 text-sm">
        <SidebarLink
          icon={<LayoutDashboard size={18} />}
          label="Overview"
          collapsed={collapsed}
          onClick={() => router.push("/dashboard")}
        />

        <SidebarLink
          icon={<PackageSearch size={18} />}
          label="All Shipments"
          collapsed={collapsed}
          onClick={() => router.push("/dashboard/all-shipments")}
        />

        <SidebarLink
          icon={<Truck size={18} />}
          label="Upload Shipments"
          collapsed={collapsed}
          onClick={() => router.push("/dashboard/upload-shipments")}
        />

        <SidebarLink
          icon={<Users size={18} />}
          label="Shipping Providers"
          collapsed={collapsed}
          onClick={() => router.push("/dashboard/shipping-providers")}
        />

        <SidebarLink
          icon={<BarChart3 size={18} />}
          label="Analytics"
          collapsed={collapsed}
          onClick={() => router.push("/dashboard/analytics")}
        />

        <SidebarLink
          icon={<LogOut size={18} />}
          label="Logout"
          collapsed={collapsed}
          onClick={() => {
            localStorage.removeItem("access_token");
            router.push("/auth");
          }}
        />
      </nav>
    </aside>
  );
}

function SidebarLink({
  icon,
  label,
  onClick,
  collapsed,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  collapsed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  );
}
