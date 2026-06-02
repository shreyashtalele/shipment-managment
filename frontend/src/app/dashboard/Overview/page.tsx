"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Truck,
  X,
} from "lucide-react";
import {
  getAnalyticsSummary,
  getAllShipments,
  updateShipmentStatus,
} from "@/api/shipments";

type Summary = {
  total: number;
  delivered: number;
  pending: number;
  in_transit: number;
  delayed: number;
  cancelled: number;
};

type Shipment = {
  id: string;
  shipment_id?: string;
  tracking_id?: string;
  external_tracking_id: string;
  origin: string;
  destination: string;
  status: string;
  estimated_delivery: string;
  weight_kg?: number;
  dimensions?: string;
  description?: string;
  created_at?: string;
};

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  in_transit: "bg-blue-100 text-blue-700 border-blue-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  delayed: "bg-orange-100 text-orange-700 border-orange-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const formatStatus = (status?: string) =>
  status
    ? status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "Unknown";

const formatDate = (date?: string) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatInputDate = (date?: string) => {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
};

export default function OverviewPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Access token not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [summaryData, shipmentData] = await Promise.all([
        getAnalyticsSummary(token),
        getAllShipments(token),
      ]);

      setSummary(summaryData);
      setShipments(shipmentData.slice(0, 10));
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredShipments = useMemo(() => {
    const query = search.toLowerCase();

    return shipments.filter((shipment) =>
      [
        shipment.external_tracking_id,
        shipment.origin,
        shipment.destination,
        shipment.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [shipments, search]);

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Dashboard Overview
          </h1>
          <p className="mt-2 text-slate-500">
            Track shipments, delivery status and latest activity.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <RefreshCw size={16} />
          )}
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <DashboardLoader />
      ) : (
        <>
          <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Total Shipments"
              value={summary?.total ?? 0}
              icon={<Package size={22} />}
              color="bg-slate-900"
            />
            <StatCard
              title="Delivered"
              value={summary?.delivered ?? 0}
              icon={<CheckCircle2 size={22} />}
              color="bg-green-600"
            />
            <StatCard
              title="Pending"
              value={summary?.pending ?? 0}
              icon={<Clock size={22} />}
              color="bg-yellow-500"
            />
            <StatCard
              title="In Transit"
              value={summary?.in_transit ?? 0}
              icon={<Truck size={22} />}
              color="bg-blue-600"
            />
            <StatCard
              title="Delayed"
              value={summary?.delayed ?? 0}
              icon={<AlertTriangle size={22} />}
              color="bg-orange-500"
            />
            <StatCard
              title="Cancelled"
              value={summary?.cancelled ?? 0}
              icon={<Ban size={22} />}
              color="bg-red-600"
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Recent Shipments
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Click any shipment to view or update status.
                </p>
              </div>

              <div className="relative w-full lg:w-96">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search shipment..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Tracking ID</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Destination</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Estimated Delivery</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredShipments.length > 0 ? (
                    filteredShipments.map((shipment) => {
                      const statusKey = shipment.status?.toLowerCase();

                      return (
                        <tr
                          key={shipment.id}
                          onClick={() => setSelectedShipment(shipment)}
                          className="cursor-pointer transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {shipment.external_tracking_id || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {shipment.origin || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {shipment.destination || "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                statusStyles[statusKey] ||
                                "border-slate-200 bg-slate-100 text-slate-700"
                              }`}
                            >
                              {formatStatus(shipment.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {formatDate(shipment.estimated_delivery)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        No shipments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <ShipmentModal
        shipment={selectedShipment}
        onClose={() => setSelectedShipment(null)}
        onUpdated={fetchDashboardData}
      />
    </main>
  );
}

function ShipmentModal({
  shipment,
  onClose,
  onUpdated,
}: {
  shipment: Shipment | null;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [newStatus, setNewStatus] = useState("");
  const [newDate, setNewDate] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    if (shipment) {
      setNewStatus(shipment.status || "pending");
      setNewDate(formatInputDate(shipment.estimated_delivery));
      setUpdateError("");
    }
  }, [shipment]);

  if (!shipment) return null;

  const statusKey = shipment.status?.toLowerCase();

  const handleUpdate = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setUpdateError("Access token not found. Please login again.");
      return;
    }

    const publicShipmentId = shipment.shipment_id;

    if (!publicShipmentId) {
      setUpdateError("Public shipment ID not found.");
      return;
    }

    try {
      setUpdating(true);
      setUpdateError("");

      await updateShipmentStatus(publicShipmentId, token, {
        status: newStatus,
        estimated_delivery: newDate,
      });

      await onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      setUpdateError("Failed to update shipment.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-blue-600">
              Shipment Details
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {shipment.external_tracking_id || shipment.tracking_id || "N/A"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(88vh-76px)] overflow-y-auto px-5 py-4">
          <div className="mb-4 flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <MapPin size={18} />
              </div>

              <div>
                <p className="text-xs text-slate-500">Route</p>
                <p className="text-base font-semibold text-slate-900">
                  {shipment.origin || "N/A"} → {shipment.destination || "N/A"}
                </p>
              </div>
            </div>

            <span
              className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                statusStyles[statusKey] ||
                "border-slate-200 bg-slate-100 text-slate-700"
              }`}
            >
              {formatStatus(shipment.status)}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBox
              label="Public Tracking ID"
              value={shipment.external_tracking_id || "N/A"}
            />
            <InfoBox
              label="Estimated Delivery"
              value={formatDate(shipment.estimated_delivery)}
            />
            <InfoBox
              label="Weight"
              value={shipment.weight_kg ? `${shipment.weight_kg} kg` : "N/A"}
            />
            <InfoBox label="Dimensions" value={shipment.dimensions || "N/A"} />
            <InfoBox
              label="Created At"
              value={formatDate(shipment.created_at)}
            />
            <InfoBox
              label="Current Status"
              value={formatStatus(shipment.status)}
            />
          </div>

          <div className="mt-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status Timeline
            </h3>

            <div className="grid gap-3 sm:grid-cols-3">
              <TimelineStep
                label="Pending"
                active={["pending", "in_transit", "delivered"].includes(
                  statusKey,
                )}
              />
              <TimelineStep
                label="In Transit"
                active={["in_transit", "delivered"].includes(statusKey)}
              />
              <TimelineStep
                label="Delivered"
                active={statusKey === "delivered"}
              />
            </div>
          </div>

          <div className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </h3>
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              {shipment.description || "No description available."}
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Update Shipment
            </h3>

            {updateError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {updateError}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="delayed">Delayed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Estimated Delivery
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>

            <button
              onClick={handleUpdate}
              disabled={updating}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {updating && <Loader2 size={15} className="animate-spin" />}
              {updating ? "Updating..." : "Update Status"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function TimelineStep({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        active
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      <div
        className={`mb-2 h-2.5 w-2.5 rounded-full ${
          active ? "bg-green-600" : "bg-slate-300"
        }`}
      />
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-bold text-slate-900">{value}</h3>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function DashboardLoader() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
          />
        ))}
      </div>

      <div className="h-96 animate-pulse rounded-2xl bg-white shadow-sm" />
    </div>
  );
}
