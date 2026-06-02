"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createShippingProvider,
  getAllShippingProviders,
  updateShippingProvider,
  type ShippingProvider,
  type ShippingProviderData,
} from "@/api/shippingProviders";

import {
  Search,
  Plus,
  Pencil,
  Truck,
  Mail,
  Phone,
  Link as LinkIcon,
  RefreshCw,
  X,
  Loader2,
  ExternalLink,
  PackageCheck,
  Users,
  RadioTower,
} from "lucide-react";

const emptyForm: ShippingProviderData = {
  name: "",
  display_name: "",
  tracking_url: "",
  contact_email: "",
  phone: "",
};

export default function ShippingProvidersPage() {
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [form, setForm] = useState<ShippingProviderData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token") || ""
      : "";

  const fetchProviders = async () => {
    setLoading(true);
    setError("");

    const result = await getAllShippingProviders(token);

    if (result.status === "success") {
      setProviders(result.data);
    } else {
      setProviders([]);
      setError(result.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProviders = useMemo(() => {
    const value = search.toLowerCase();

    return providers.filter((provider) =>
      `${provider.name} ${provider.display_name} ${provider.contact_email} ${provider.phone}`
        .toLowerCase()
        .includes(value),
    );
  }, [providers, search]);

  const trackingEnabled = providers.filter((p) => p.tracking_url).length;
  const contactAvailable = providers.filter(
    (p) => p.contact_email || p.phone,
  ).length;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setError("");
    setOpenModal(true);
  };

  const openEditModal = (provider: ShippingProvider) => {
    setForm({
      name: provider.name || "",
      display_name: provider.display_name || "",
      tracking_url: provider.tracking_url || "",
      contact_email: provider.contact_email || "",
      phone: provider.phone || "",
    });

    setEditingId(provider.id);
    setError("");
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Provider name is required.");
      return;
    }

    if (!form.display_name?.trim()) {
      setError("Display name is required.");
      return;
    }

    setSaving(true);
    setError("");

    const payload: ShippingProviderData = {
      name: form.name.trim(),
      display_name: form.display_name?.trim(),
      tracking_url: form.tracking_url?.trim(),
      contact_email: form.contact_email?.trim(),
      phone: form.phone?.trim(),
    };

    const result = editingId
      ? await updateShippingProvider(token, editingId, payload)
      : await createShippingProvider(token, payload);

    if (result.status === "error") {
      setError(result.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setOpenModal(false);
    resetForm();
    fetchProviders();
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-5 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-7 py-7 text-white">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-medium text-blue-100 backdrop-blur">
                  <Truck size={15} />
                  Provider Management
                </div>

                <h1 className="text-3xl font-bold tracking-tight">
                  Shipping Providers
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Manage courier partners, tracking links and contact details
                  from one premium dashboard.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={fetchProviders}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>

                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-blue-50"
                >
                  <Plus size={16} />
                  Add Provider
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title="Total Providers"
            value={providers.length}
            description="Courier partners"
            icon={<Users size={20} />}
          />

          <StatsCard
            title="Tracking Enabled"
            value={trackingEnabled}
            description="Tracking URLs added"
            icon={<RadioTower size={20} />}
          />

          <StatsCard
            title="Contact Available"
            value={contactAvailable}
            description="Email or phone added"
            icon={<PackageCheck size={20} />}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Provider Directory
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing {filteredProviders.length} of {providers.length} records
              </p>
            </div>

            <div className="relative w-full lg:w-[340px]">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search provider..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4">Provider</th>
                  <th className="px-5 py-4">System Name</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Tracking</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex items-center justify-center gap-3 text-slate-500">
                        <Loader2 className="animate-spin" size={20} />
                        Loading providers...
                      </div>
                    </td>
                  </tr>
                ) : filteredProviders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                          <Truck size={26} />
                        </div>

                        <h3 className="mt-4 text-base font-bold text-slate-900">
                          No providers found
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Add your first shipping provider to manage tracking.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProviders.map((provider) => (
                    <tr
                      key={provider.id}
                      className="border-b border-slate-100 transition hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold uppercase text-white">
                            {(provider.display_name || provider.name || "P")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-bold text-slate-950">
                              {provider.display_name || "-"}
                            </p>

                            <p className="text-xs text-slate-500">
                              Shipping Partner
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {provider.name || "-"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1.5 text-slate-600">
                          {provider.contact_email && (
                            <div className="flex items-center gap-2">
                              <Mail size={15} className="text-slate-400" />
                              {provider.contact_email}
                            </div>
                          )}

                          {provider.phone && (
                            <div className="flex items-center gap-2">
                              <Phone size={15} className="text-slate-400" />
                              {provider.phone}
                            </div>
                          )}

                          {!provider.contact_email && !provider.phone && (
                            <span className="text-slate-400">Not Added</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {provider.tracking_url ? (
                          <a
                            href={provider.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                          >
                            Open Tracking
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <span className="inline-flex rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-500">
                            Not Added
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openEditModal(provider)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {editingId ? "Update Provider" : "Create Provider"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add courier partner details.
                </p>
              </div>

              <button
                onClick={() => {
                  setOpenModal(false);
                  resetForm();
                }}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-5 px-6 py-6">
              <FormInput
                label="Provider Name"
                placeholder="e.g. delhivery"
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
                required
              />

              <FormInput
                label="Display Name"
                placeholder="e.g. Delhivery"
                value={form.display_name || ""}
                onChange={(value) => setForm({ ...form, display_name: value })}
                required
              />

              <FormInput
                label="Tracking URL"
                placeholder="https://example.com/track/{tracking_number}"
                value={form.tracking_url || ""}
                onChange={(value) => setForm({ ...form, tracking_url: value })}
                icon={<LinkIcon size={16} />}
              />

              <div className="grid gap-5 md:grid-cols-2">
                <FormInput
                  label="Contact Email"
                  placeholder="support@example.com"
                  value={form.contact_email || ""}
                  onChange={(value) =>
                    setForm({ ...form, contact_email: value })
                  }
                  icon={<Mail size={16} />}
                />

                <FormInput
                  label="Phone"
                  placeholder="9876543210"
                  value={form.phone || ""}
                  onChange={(value) => setForm({ ...form, phone: value })}
                  icon={<Phone size={16} />}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5">
              <button
                onClick={() => {
                  setOpenModal(false);
                  resetForm();
                }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}

                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Provider"
                    : "Create Provider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>

          <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </h3>

          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  required,
  icon,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
            icon ? "pl-11 pr-4" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}
