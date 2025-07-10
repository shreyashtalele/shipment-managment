"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  PackageSearch,
  Truck,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  PackageCheck,
  Clock,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { getAnalyticsSummary, getAllShipments } from "@/api/shipments";

const inter = Inter({ subsets: ["latin"] });

interface Summary {
  total: number;
  delivered: number;
  pending: number;
  in_transit: number;
  delayed: number;
  cancelled: number;
}

interface Shipment {
  id: string;
  external_tracking_id: string;
  origin: string;
  destination: string;
  status: string;
  estimated_delivery: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [tokenExists, setTokenExists] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/auth");
    } else {
      setTokenExists(true);
      fetchAnalytics(token);
      fetchRecentShipments(token);
    }
  }, [router]);

  const fetchAnalytics = async (token: string) => {
    try {
      const data = await getAnalyticsSummary(token);
      setSummary(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  };

  const fetchRecentShipments = async (token: string) => {
    try {
      const data = await getAllShipments(token);
      setRecentShipments(data.slice(0, 10));
    } catch (error) {
      console.error("Failed to fetch recent shipments:", error);
    }
  };

  if (!tokenExists) return null;

  return (
    <div
      className={`${inter.className} flex min-h-screen bg-[#f9fafb] text-gray-900`}
    >
      {/* Sidebar */}
      <aside
        className={`bg-white shadow-md p-6 h-screen transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        } fixed z-20`}
      >
        <div className="flex items-center justify-between mb-10">
          {!collapsed && (
            <h1 className="text-2xl font-bold tracking-tight">TF</h1>
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
          />
          <SidebarLink
            icon={<PackageSearch size={18} />}
            label="Shipments"
            collapsed={collapsed}
          />
          <SidebarLink
            icon={<Truck size={18} />}
            label="Providers"
            collapsed={collapsed}
          />
          <SidebarLink
            icon={<BarChart3 size={18} />}
            label="Analytics"
            collapsed={collapsed}
          />
          <SidebarLink
            icon={<Users size={18} />}
            label="Users"
            collapsed={collapsed}
          />
          <SidebarLink
            icon={<Settings size={18} />}
            label="Settings"
            collapsed={collapsed}
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

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-64"
        } p-10 space-y-8`}
      >
        <section>
          <h2 className="text-3xl font-semibold mb-2">Dashboard Overview</h2>
          <p className="text-gray-600">Real-time shipment analytics</p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {summary && (
            <>
              <StatCard
                icon={<LayoutDashboard size={20} />}
                title="Total Shipments"
                value={String(summary.total)}
                subtitle="All-time"
              />
              <StatCard
                icon={<PackageCheck size={20} />}
                title="Delivered"
                value={String(summary.delivered)}
                subtitle="Completed deliveries"
              />
              <StatCard
                icon={<Clock size={20} />}
                title="Pending"
                value={String(summary.pending)}
                subtitle="Awaiting dispatch"
              />
              <StatCard
                icon={<Truck size={20} />}
                title="In Transit"
                value={String(summary.in_transit)}
                subtitle="Currently shipping"
              />
              <StatCard
                icon={<AlertTriangle size={20} />}
                title="Delayed"
                value={String(summary.delayed)}
                subtitle="Late arrivals"
              />
              <StatCard
                icon={<Ban size={20} />}
                title="Cancelled"
                value={String(summary.cancelled)}
                subtitle="Orders cancelled"
              />
            </>
          )}
        </section>

        {/* Recent Shipments */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Shipments</h3>
            <button
              onClick={() => router.push("/shipments")}
              className="text-sm text-black hover:underline"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase border-b">
                <tr>
                  <th className="py-2 px-4">Tracking ID</th>
                  <th className="py-2 px-4">Source</th>
                  <th className="py-2 px-4">Destination</th>
                  <th className="py-2 px-4">Status</th>
                  <th className="py-2 px-4">Estimated Delivery</th>
                </tr>
              </thead>
              <tbody>
                {recentShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 font-medium text-gray-900">
                      {shipment.external_tracking_id}
                    </td>
                    <td className="py-2 px-4">{shipment.origin}</td>
                    <td className="py-2 px-4">{shipment.destination}</td>
                    <td className="py-2 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          shipment.status === "Delivered"
                            ? "bg-green-100 text-green-700"
                            : shipment.status === "InTransit"
                            ? "bg-blue-100 text-blue-700"
                            : shipment.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : shipment.status === "Delayed"
                            ? "bg-orange-100 text-orange-700"
                            : shipment.status === "Cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {shipment.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-gray-500">
                      {new Date(
                        shipment.estimated_delivery
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
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

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
      {icon && <div className="text-gray-500">{icon}</div>}
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
