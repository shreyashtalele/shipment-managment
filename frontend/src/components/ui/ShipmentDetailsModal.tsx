"use client";

import { X, Truck, Calendar, Package, MapPin } from "lucide-react";

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

type Props = {
  shipment: Shipment | null;
  onClose: () => void;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_transit: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  delayed: "bg-orange-100 text-orange-700",
  cancelled: "bg-red-100 text-red-700",
};

const formatStatus = (status?: string) =>
  status
    ? status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Unknown";

export default function ShipmentDetailsModal({ shipment, onClose }: Props) {
  if (!shipment) return null;

  const statusKey = shipment.status?.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b p-6">
          <div>
            <p className="text-sm text-gray-500">Shipment Details</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              {shipment.external_tracking_id}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <MapPin className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Route</p>
                <p className="font-semibold text-gray-900">
                  {shipment.origin} → {shipment.destination}
                </p>
              </div>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                statusColors[statusKey] || "bg-gray-100 text-gray-700"
              }`}
            >
              {formatStatus(shipment.status)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard
              icon={<Package />}
              label="Shipment ID"
              value={shipment.shipment_id || shipment.id}
            />
            <InfoCard
              icon={<Truck />}
              label="Tracking ID"
              value={shipment.tracking_id || shipment.external_tracking_id}
            />
            <InfoCard
              icon={<Calendar />}
              label="Estimated Delivery"
              value={formatDate(shipment.estimated_delivery)}
            />
            <InfoCard
              icon={<Package />}
              label="Weight"
              value={shipment.weight_kg ? `${shipment.weight_kg} kg` : "N/A"}
            />
            <InfoCard
              icon={<Package />}
              label="Dimensions"
              value={shipment.dimensions || "N/A"}
            />
            <InfoCard
              icon={<Calendar />}
              label="Created At"
              value={formatDate(shipment.created_at)}
            />
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-gray-900">
              Status Timeline
            </h3>
            <div className="flex items-center gap-3 text-sm">
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

          <div>
            <h3 className="mb-2 font-semibold text-gray-900">Description</h3>
            <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              {shipment.description || "No description available."}
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t pt-5">
            <button
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Close
            </button>
            <button className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
              Update Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-2 text-gray-400">{icon}</div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-all font-medium text-gray-900">{value}</p>
    </div>
  );
}

function TimelineStep({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-3 w-3 rounded-full ${active ? "bg-green-600" : "bg-gray-300"}`}
      />
      <span className={active ? "font-medium text-gray-900" : "text-gray-400"}>
        {label}
      </span>
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
