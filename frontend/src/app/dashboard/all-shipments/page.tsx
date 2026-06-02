"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  Loader2,
  MapPin,
  PackageSearch,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";

import {
  deleteShipment,
  exportShipmentsCsv,
  getAllShipments,
  updateShipmentStatus,
} from "@/api/shipments";

import { getAllShippingProviders } from "@/api/shippingProviders";

type Shipment = {
  id: string;
  shipment_id?: string;
  tracking_id?: string;
  external_tracking_id?: string;
  origin?: string;
  destination?: string;
  status?: string;
  provider_id?: string;
  estimated_delivery?: string;
  weight_kg?: number;
  dimensions?: string;
  description?: string;
  created_at?: string;
};

type Provider = {
  id: string;
  name?: string;
  display_name?: string;
};

const statusOptions = ["pending", "in_transit", "delivered", "cancelled"];

export default function AllShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewShipment, setViewShipment] = useState<Shipment | null>(null);
  const [editShipment, setEditShipment] = useState<Shipment | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Unauthorized. Please login again.");
        return;
      }

      const [shipmentData, providerData] = await Promise.all([
        getAllShipments(token),
        getAllShippingProviders(token),
      ]);

      const shipmentList = Array.isArray(shipmentData)
        ? shipmentData
        : shipmentData?.data || [];

      setShipments(shipmentList);

      if (providerData.status === "success") {
        setProviders(providerData.data || []);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getProviderDisplayName = (providerId?: string) => {
    if (!providerId) return "N/A";

    const provider = providers.find(
      (item) => String(item.id).trim() === String(providerId).trim(),
    );

    return provider?.display_name || provider?.name || "Unknown Provider";
  };

  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      const query = search.toLowerCase();
      const providerName = getProviderDisplayName(shipment.provider_id);

      const matchesSearch =
        !query ||
        shipment.external_tracking_id?.toLowerCase().includes(query) ||
        shipment.tracking_id?.toLowerCase().includes(query) ||
        shipment.origin?.toLowerCase().includes(query) ||
        shipment.destination?.toLowerCase().includes(query) ||
        shipment.status?.toLowerCase().includes(query) ||
        providerName.toLowerCase().includes(query);

      const normalizedStatus = shipment.status?.toLowerCase().replace(" ", "_");
      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [shipments, providers, search, statusFilter]);

  const summary = {
    total: shipments.length,
    pending: shipments.filter((s) => s.status === "pending").length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
    transit: shipments.filter(
      (s) => s.status === "in_transit" || s.status === "in transit",
    ).length,
  };

  const handleDelete = async (shipment: Shipment) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const publicId = shipment.shipment_id || shipment.id;

    if (!confirm("Delete this shipment?")) return;

    try {
      setActionLoading(true);
      await deleteShipment(publicId, token);
      await fetchData();
    } catch (err: any) {
      alert(err?.message || "Failed to delete shipment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const blob = await exportShipmentsCsv(token);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "all_shipments.csv";
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || "Failed to export CSV");
    }
  };

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#f8fafc] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1280px]">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-500">
              Dashboard / Shipments
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              All Shipments
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Monitor, manage, export and track all shipment records from one
              clean dashboard.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              onClick={fetchData}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={handleExport}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Shipments"
            value={summary.total}
            text="All shipment records"
            icon={<PackageSearch size={22} />}
            variant="slate"
          />

          <SummaryCard
            title="In Transit"
            value={summary.transit}
            text="Currently moving"
            icon={<Truck size={22} />}
            variant="blue"
          />

          <SummaryCard
            title="Delivered"
            value={summary.delivered}
            text="Successfully completed"
            icon={<CheckCircle2 size={22} />}
            variant="green"
          />

          <SummaryCard
            title="Pending"
            value={summary.pending}
            text="Awaiting processing"
            icon={<CalendarDays size={22} />}
            variant="amber"
          />
        </section>

        <section className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tracking ID, route, provider, status..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-[190px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <StateMessage
              icon={<Loader2 className="animate-spin" size={28} />}
              title="Loading shipments"
              text="Please wait while we fetch shipment records."
            />
          ) : error ? (
            <StateMessage
              icon={<AlertCircle size={28} />}
              title="Unable to load shipments"
              text={error}
              danger
            />
          ) : filteredShipments.length === 0 ? (
            <StateMessage
              icon={<PackageSearch size={32} />}
              title="No shipments found"
              text="No shipment matched your search or selected filter."
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <TableHead>Shipment</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Shipping Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead align="right">Actions</TableHead>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredShipments.map((shipment) => (
                      <tr
                        key={shipment.id}
                        className="group transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-5">
                          <p className="max-w-[190px] truncate text-sm font-black text-slate-950">
                            {shipment.external_tracking_id || "N/A"}
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-400">
                            External Tracking ID
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-start gap-3">
                            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 transition group-hover:bg-slate-900 group-hover:text-white">
                              <MapPin size={17} />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[230px] truncate font-bold text-slate-900">
                                {shipment.origin || "N/A"} →{" "}
                                {shipment.destination || "N/A"}
                              </p>
                              <p className="mt-1 text-xs font-medium text-slate-400">
                                Origin to destination
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <p className="max-w-[190px] truncate font-bold text-slate-900">
                            {getProviderDisplayName(shipment.provider_id)}
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-400">
                            Display name
                          </p>
                        </td>

                        <td className="px-5 py-5">
                          <StatusBadge status={shipment.status || "pending"} />
                        </td>

                        <td className="px-5 py-5 font-bold text-slate-700">
                          {formatDate(shipment.estimated_delivery)}
                        </td>

                        <td className="px-5 py-5 font-bold text-slate-700">
                          {shipment.weight_kg
                            ? `${shipment.weight_kg} kg`
                            : "N/A"}
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex justify-end gap-2">
                            <ActionButton
                              title="View"
                              onClick={() => setViewShipment(shipment)}
                              icon={<Eye size={16} />}
                            />

                            <ActionButton
                              title="Edit"
                              onClick={() => setEditShipment(shipment)}
                              icon={<Edit3 size={16} />}
                            />

                            <ActionButton
                              title="Delete"
                              danger
                              disabled={actionLoading}
                              onClick={() => handleDelete(shipment)}
                              icon={<Trash2 size={16} />}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 lg:hidden">
                {filteredShipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-black text-slate-950">
                          {shipment.external_tracking_id || "N/A"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {shipment.origin || "N/A"} →{" "}
                          {shipment.destination || "N/A"}
                        </p>
                      </div>

                      <StatusBadge status={shipment.status || "pending"} />
                    </div>

                    <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                      <MobileRow
                        label="Provider"
                        value={getProviderDisplayName(shipment.provider_id)}
                      />
                      <MobileRow
                        label="Delivery"
                        value={formatDate(shipment.estimated_delivery)}
                      />
                      <MobileRow
                        label="Weight"
                        value={
                          shipment.weight_kg
                            ? `${shipment.weight_kg} kg`
                            : "N/A"
                        }
                      />
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <ActionButton
                        title="View"
                        onClick={() => setViewShipment(shipment)}
                        icon={<Eye size={16} />}
                      />

                      <ActionButton
                        title="Edit"
                        onClick={() => setEditShipment(shipment)}
                        icon={<Edit3 size={16} />}
                      />

                      <ActionButton
                        title="Delete"
                        danger
                        disabled={actionLoading}
                        onClick={() => handleDelete(shipment)}
                        icon={<Trash2 size={16} />}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {viewShipment && (
        <ViewModal
          shipment={viewShipment}
          providerName={getProviderDisplayName(viewShipment.provider_id)}
          onClose={() => setViewShipment(null)}
        />
      )}

      {editShipment && (
        <EditModal
          shipment={editShipment}
          onClose={() => setEditShipment(null)}
          onSaved={async () => {
            setEditShipment(null);
            await fetchData();
          }}
        />
      )}
    </main>
  );
}

function SummaryCard({
  title,
  value,
  text,
  icon,
  variant,
}: {
  title: string;
  value: number;
  text: string;
  icon: ReactNode;
  variant: "slate" | "blue" | "green" | "amber";
}) {
  const styles = {
    slate: {
      card: "border-slate-200 bg-white",
      icon: "bg-slate-100 text-slate-700",
      text: "text-slate-500",
    },
    blue: {
      card: "border-blue-100 bg-gradient-to-br from-blue-50 to-white",
      icon: "bg-blue-100 text-blue-700",
      text: "text-blue-600",
    },
    green: {
      card: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
      icon: "bg-emerald-100 text-emerald-700",
      text: "text-emerald-600",
    },
    amber: {
      card: "border-amber-100 bg-gradient-to-br from-amber-50 to-white",
      icon: "bg-amber-100 text-amber-700",
      text: "text-amber-600",
    },
  };

  return (
    <div
      className={`min-w-0 rounded-3xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${styles[variant].card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-500">{title}</p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">{value}</h2>
          <p
            className={`mt-2 truncate text-sm font-bold ${styles[variant].text}`}
          >
            {text}
          </p>
        </div>

        <div className={`shrink-0 rounded-2xl p-4 ${styles[variant].icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function TableHead({
  children,
  align,
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-5 text-xs font-black uppercase tracking-wider text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(" ", "_");

  const className =
    normalized === "delivered"
      ? "border-emerald-200 bg-emerald-100 text-emerald-700"
      : normalized === "in_transit"
        ? "border-blue-200 bg-blue-100 text-blue-700"
        : normalized === "cancelled"
          ? "border-red-200 bg-red-100 text-red-700"
          : "border-amber-200 bg-amber-100 text-amber-700";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-3 py-1.5 text-xs font-black capitalize ${className}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function ActionButton({
  icon,
  onClick,
  title,
  danger,
  disabled,
}: {
  icon: ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border p-2.5 transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border-red-100 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-950 hover:text-white"
      }`}
    >
      {icon}
    </button>
  );
}

function MobileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-black uppercase text-slate-400">
        {label}
      </span>
      <span className="truncate text-right text-sm font-bold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function ViewModal({
  shipment,
  providerName,
  onClose,
}: {
  shipment: Shipment;
  providerName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <ModalHeader title="Shipment Details" onClose={onClose} />

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Detail
            label="External Tracking ID"
            value={shipment.external_tracking_id}
          />
          <Detail label="Shipping Provider" value={providerName} />
          <Detail label="Origin" value={shipment.origin} />
          <Detail label="Destination" value={shipment.destination} />
          <Detail label="Status" value={shipment.status?.replace("_", " ")} />
          <Detail
            label="Expected Delivery"
            value={formatDate(shipment.estimated_delivery)}
          />
          <Detail
            label="Weight"
            value={shipment.weight_kg ? `${shipment.weight_kg} kg` : "N/A"}
          />
          <Detail label="Dimensions" value={shipment.dimensions} />
        </div>
      </div>
    </div>
  );
}

function EditModal({
  shipment,
  onClose,
  onSaved,
}: {
  shipment: Shipment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(shipment.status || "pending");
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    shipment.estimated_delivery || "",
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const publicId = shipment.shipment_id || shipment.id;

    try {
      setSaving(true);

      await updateShipmentStatus(publicId, token, {
        status,
        estimated_delivery: estimatedDelivery || undefined,
      });

      await onSaved();
    } catch (err: any) {
      alert(err?.message || "Failed to update shipment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <ModalHeader title="Edit Shipment" onClose={onClose} />

        <div className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              External Tracking ID
            </label>
            <input
              value={shipment.external_tracking_id || "N/A"}
              disabled
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            >
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Estimated Delivery
            </label>
            <input
              type="date"
              value={estimatedDelivery?.slice(0, 10)}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 p-5">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>

      <button
        onClick={onClose}
        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-all text-sm font-bold text-slate-800">
        {value || "N/A"}
      </p>
    </div>
  );
}

function StateMessage({
  icon,
  title,
  text,
  danger,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-20 text-center ${
        danger ? "text-red-600" : "text-slate-500"
      }`}
    >
      <div
        className={`rounded-full p-5 ${danger ? "bg-red-50" : "bg-slate-100"}`}
      >
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-black text-slate-900">{title}</h3>

      <p className="mt-2 max-w-md text-sm leading-6">{text}</p>
    </div>
  );
}

function formatDate(date?: string) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
