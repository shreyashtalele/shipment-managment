"use client";

import { useEffect, useState } from "react";
import {
  getAllShippingProviders,
  createShippingProvider,
  updateShippingProvider,
} from "@/api/shippingProviders";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

// Define provider type
interface ShippingProvider {
  id: string;
  name: string;
  display_name?: string;
  tracking_url?: string;
  contact_email?: string;
  phone?: string;
}

export default function ShippingProvidersPage() {
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [token, setToken] = useState("");
  const [form, setForm] = useState<Omit<ShippingProvider, "id">>({
    name: "",
    display_name: "",
    tracking_url: "",
    contact_email: "",
    phone: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token") || "";
    setToken(storedToken);
    fetchProviders(storedToken);
  }, []);

  const fetchProviders = async (token: string) => {
    try {
      const result = await getAllShippingProviders(token);
      setProviders(result.data); // ✅ match updated API return shape
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await updateShippingProvider(token, editingId, form);
      } else {
        await createShippingProvider(token, form);
      }

      resetForm();
      setDialogOpen(false);
      fetchProviders(token);
    } catch (error) {
      console.error("Error saving provider:", error);
    }
  };

  const startEdit = (provider: ShippingProvider) => {
    setForm({
      name: provider.name || "",
      display_name: provider.display_name || "",
      tracking_url: provider.tracking_url || "",
      contact_email: provider.contact_email || "",
      phone: provider.phone || "",
    });
    setEditingId(provider.id);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setForm({
      name: "",
      display_name: "",
      tracking_url: "",
      contact_email: "",
      phone: "",
    });
    setEditingId(null);
  };

  return (
    <div className={`${inter.className} p-8 font-sans bg-gray-50 space-y-6`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800">
          Shipping Providers
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary text-white hover:bg-primary/90"
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-medium text-gray-900">
                {editingId ? "Edit Provider" : "Add Provider"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {Object.entries(form).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={key} className="text-sm text-gray-700">
                    {key.replace("_", " ").toUpperCase()}
                  </Label>
                  <Input
                    id={key}
                    placeholder={`Enter ${key.replace("_", " ")}`}
                    className="bg-white border-gray-300"
                    value={value ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                onClick={handleSubmit}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-sm rounded-xl">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-6 py-3">Display Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Tracking URL</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {provider.display_name || provider.name}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {provider.contact_email || "-"}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {provider.phone || "-"}
                </td>
                <td className="px-6 py-4">
                  {provider.tracking_url ? (
                    <a
                      href={provider.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Track
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-6 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm"
                    onClick={() => startEdit(provider)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
