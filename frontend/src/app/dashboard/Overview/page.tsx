"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  PackageCheck,
  Clock,
  Truck,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { getAnalyticsSummary, getAllShipments } from "@/api/shipments";

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

export default function OverviewPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetchAnalytics(token);
    fetchRecentShipments(token);
  }, []);

  const fetchAnalytics = async (token: string) => {
    try {
      const data = await getAnalyticsSummary(token);
      setSummary(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const fetchRecentShipments = async (token: string) => {
    try {
      const data = await getAllShipments(token);
      setRecentShipments(data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching shipments:", error);
    }
  };

  return (
    <div className="p-8 space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-semibold text-gray-800 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-500">Real-time shipment analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {summary && (
          <>
            <StatCard
              icon={<LayoutDashboard size={20} />}
              title="Total"
              value={summary.total}
            />
            <StatCard
              icon={<PackageCheck size={20} />}
              title="Delivered"
              value={summary.delivered}
            />
            <StatCard
              icon={<Clock size={20} />}
              title="Pending"
              value={summary.pending}
            />
            <StatCard
              icon={<Truck size={20} />}
              title="In Transit"
              value={summary.in_transit}
            />
            <StatCard
              icon={<AlertTriangle size={20} />}
              title="Delayed"
              value={summary.delayed}
            />
            <StatCard
              icon={<Ban size={20} />}
              title="Cancelled"
              value={summary.cancelled}
            />
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Shipments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase border-b">
              <tr>
                <th className="py-2 px-4">Tracking ID</th>
                <th className="py-2 px-4">Origin</th>
                <th className="py-2 px-4">Destination</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Estimated Delivery</th>
              </tr>
            </thead>
            <tbody>
              {recentShipments.map((shipment) => (
                <tr key={shipment.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{shipment.external_tracking_id}</td>
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
                    {new Date(shipment.estimated_delivery).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
      <div className="text-gray-500">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
      </div>
    </div>
  );
}
