// components/Sidebar.tsx
"use client";

import {
  LayoutDashboard,
  PackageSearch,
  Truck,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const router = useRouter();

  return (
    <aside
      className={`bg-white shadow-md p-6 h-screen transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } fixed z-20`}
    >
      <div className="flex items-center justify-between mb-10">
        {!collapsed && (
          <h1 className="text-2xl font-bold tracking-tight">TrackFast</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-gray-900"
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="space-y-4 text-sm">
        <SidebarLink
          icon={<LayoutDashboard size={18} />}
          label="Overview"
          collapsed={collapsed}
          onClick={() => router.push("/dashboard")}
        />
        <SidebarLink
          icon={<PackageSearch size={18} />}
          label="Shipments"
          collapsed={collapsed}
          onClick={() => router.push("/dashboard/shipments")}
        />
        <SidebarLink
          icon={<Truck size={18} />}
          label="Providers"
          collapsed={collapsed}
          onClick={() => router.push("/dashboard/Shippingproviders")}
        />
        <SidebarLink
          icon={<BarChart3 size={18} />}
          label="Analytics"
          collapsed={collapsed}
          onClick={() => router.push("/dashboard/Analytics")}
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
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  collapsed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 w-full text-left"
    >
      {icon}
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  );
}
