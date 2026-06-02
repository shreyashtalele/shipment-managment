"use client";

import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Truck,
  Upload,
} from "lucide-react";
import { getAccessToken } from "@/lib/auth";
import {
  getAllShippingProviders,
  type ShippingProvider,
} from "@/api/shippingProviders";
import { createBulkShipments } from "@/api/shipments";

const FIELD_OPTIONS = [
  "origin",
  "destination",
  "status",
  "estimated_delivery",
  "weight_kg",
  "dimensions",
  "description",
  "external_tracking_id",
];

const REQUIRED_FIELDS = ["origin", "destination"];
const VALID_STATUSES = [
  "pending",
  "in_transit",
  "delivered",
  "delayed",
  "cancelled",
];

const toSafeMessage = (value: unknown): string => {
  if (!value) return "Something went wrong";
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  return JSON.stringify(value);
};

type ValidationIssue = {
  row: number;
  field: string;
  message: string;
};

export default function UploadShipmentsPage() {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState("");

  const [loadingProviders, setLoadingProviders] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [successStats, setSuccessStats] = useState<{
    total: number;
    provider: string;
    uploadedAt: string;
  } | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const showMessage = (type: "success" | "error", text: unknown) => {
    setMessageType(type);
    setMessage(toSafeMessage(text));
  };

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      const token = await getAccessToken();
      const res = await getAllShippingProviders(token);

      if (res.status === "success") {
        setProviders(res.data || []);
      } else {
        showMessage("error", res.message || "Failed to fetch providers.");
      }
    } catch (err) {
      showMessage("error", err);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showMessage("error", "Please upload a valid CSV file.");
      return;
    }

    setParsing(true);
    setMessage("");
    setMessageType("");
    setSuccessStats(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];

        if (!rows.length) {
          showMessage("error", "CSV file is empty.");
          setParsing(false);
          return;
        }

        const detectedColumns = Object.keys(rows[0]).filter(Boolean);

        if (!detectedColumns.length) {
          showMessage("error", "No valid columns found in CSV.");
          setParsing(false);
          return;
        }

        setCsvData(rows);
        setColumns(detectedColumns);
        setMapping({});
        setParsing(false);
      },
      error: () => {
        showMessage("error", "Failed to read CSV file.");
        setParsing(false);
      },
    });
  };

  const handleMappingChange = (csvColumn: string, backendField: string) => {
    setMapping((prev) => ({
      ...prev,
      [csvColumn]: backendField,
    }));
  };

  const mappedFields = useMemo(() => {
    return Object.values(mapping).filter(Boolean);
  }, [mapping]);

  const selectedProvider = providers.find(
    (provider) => provider.id === selectedProviderId,
  );

  const validationIssues = useMemo<ValidationIssue[]>(() => {
    const issues: ValidationIssue[] = [];

    if (!csvData.length) return issues;

    REQUIRED_FIELDS.forEach((field) => {
      if (!mappedFields.includes(field)) {
        issues.push({
          row: 0,
          field,
          message: `Required field "${field}" is not mapped.`,
        });
      }
    });

    const fieldToCsvColumn: Record<string, string> = {};
    Object.entries(mapping).forEach(([csvColumn, backendField]) => {
      if (backendField) fieldToCsvColumn[backendField] = csvColumn;
    });

    csvData.forEach((row, index) => {
      const rowNumber = index + 2;

      REQUIRED_FIELDS.forEach((field) => {
        const csvColumn = fieldToCsvColumn[field];
        if (csvColumn && !String(row[csvColumn] || "").trim()) {
          issues.push({
            row: rowNumber,
            field,
            message: `${field} is required.`,
          });
        }
      });

      const statusColumn = fieldToCsvColumn.status;
      if (statusColumn && row[statusColumn]) {
        const status = String(row[statusColumn]).trim();
        if (!VALID_STATUSES.includes(status)) {
          issues.push({
            row: rowNumber,
            field: "status",
            message: `Invalid status "${status}".`,
          });
        }
      }

      const weightColumn = fieldToCsvColumn.weight_kg;
      if (weightColumn && row[weightColumn]) {
        const weight = Number(row[weightColumn]);
        if (Number.isNaN(weight) || weight < 0) {
          issues.push({
            row: rowNumber,
            field: "weight_kg",
            message: "Weight must be a valid positive number.",
          });
        }
      }

      const dateColumn = fieldToCsvColumn.estimated_delivery;
      if (dateColumn && row[dateColumn]) {
        const date = new Date(row[dateColumn]);
        if (Number.isNaN(date.getTime())) {
          issues.push({
            row: rowNumber,
            field: "estimated_delivery",
            message: "Estimated delivery must be a valid date.",
          });
        }
      }
    });

    return issues;
  }, [csvData, mapping, mappedFields]);

  const validRowsCount = Math.max(
    csvData.length - validationIssues.filter((i) => i.row !== 0).length,
    0,
  );

  const getMappedShipments = () => {
    return csvData.map((row) => {
      const shipment: any = {
        provider_id: selectedProviderId,
      };

      Object.entries(mapping).forEach(([csvColumn, backendField]) => {
        if (!backendField) return;

        const rawValue = row[csvColumn];

        if (rawValue === "" || rawValue === null || rawValue === undefined)
          return;

        if (backendField === "weight_kg") {
          const weight = Number(rawValue);
          if (!Number.isNaN(weight)) shipment[backendField] = weight;
        } else {
          shipment[backendField] = String(rawValue).trim();
        }
      });

      return shipment;
    });
  };

  const handleSubmit = async () => {
    if (!selectedProviderId) {
      showMessage("error", "Please select a shipping provider.");
      return;
    }

    if (!csvData.length) {
      showMessage("error", "Please upload a CSV file.");
      return;
    }

    if (validationIssues.length > 0) {
      showMessage(
        "error",
        "Please fix CSV validation errors before uploading.",
      );
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(15);
      setMessage("");
      setMessageType("");

      const token = await getAccessToken();
      setUploadProgress(40);

      const shipments = getMappedShipments();
      setUploadProgress(65);

      const res = await createBulkShipments(token, shipments);
      setUploadProgress(90);

      if (res.status === "success") {
        setUploadProgress(100);
        showMessage("success", "Shipments uploaded successfully!");

        setSuccessStats({
          total: shipments.length,
          provider:
            selectedProvider?.display_name ||
            selectedProvider?.name ||
            "Selected provider",
          uploadedAt: new Date().toLocaleString("en-IN"),
        });

        setCsvData([]);
        setColumns([]);
        setMapping({});
        setSelectedProviderId("");
      } else {
        showMessage("error", res.message || "Bulk shipment upload failed.");
      }
    } catch (err) {
      showMessage("error", err);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 600);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-blue-600">Shipment Management</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Upload Shipments
        </h1>
        <p className="mt-2 text-slate-500">
          Select provider, upload CSV, validate data, preview rows and create
          bulk shipments.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="mt-0.5">
            {messageType === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
          </div>
          <span className="break-words">{message}</span>
        </div>
      )}

      {successStats && (
        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <SuccessCard label="Uploaded Records" value={successStats.total} />
          <SuccessCard label="Provider Used" value={successStats.provider} />
          <SuccessCard label="Uploaded At" value={successStats.uploadedAt} />
        </section>
      )}

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Truck size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Select Shipping Provider
            </h2>
            <p className="text-sm text-slate-500">
              Provider ID is used internally. Only display name is shown.
            </p>
          </div>
        </div>

        <select
          value={selectedProviderId}
          onChange={(e) => setSelectedProviderId(e.target.value)}
          disabled={loadingProviders}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
        >
          <option value="">
            {loadingProviders ? "Loading providers..." : "Select provider"}
          </option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.display_name || provider.name}
            </option>
          ))}
        </select>

        {selectedProvider && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            Selected Provider:{" "}
            <span className="font-semibold">
              {selectedProvider.display_name || selectedProvider.name}
            </span>
          </div>
        )}
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <FileSpreadsheet size={26} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Upload CSV File
              </h2>
              <p className="text-sm text-slate-500">
                CSV should contain shipment fields only.
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
            {parsing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {parsing ? "Reading CSV..." : "Choose CSV"}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </section>

      {columns.length > 0 && (
        <>
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Map CSV Columns
                </h2>
                <p className="text-sm text-slate-500">
                  Required: origin and destination. Provider is selected
                  separately.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                {csvData.length} records detected
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {columns.map((column) => (
                <div
                  key={column}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="mb-2 text-sm font-semibold text-slate-800">
                    CSV Column: {column}
                  </p>
                  <select
                    value={mapping[column] || ""}
                    onChange={(e) =>
                      handleMappingChange(column, e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Do not import</option>
                    {FIELD_OPTIONS.map((field) => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-6 grid gap-4 md:grid-cols-3">
            <ValidationCard label="Total Rows" value={csvData.length} />
            <ValidationCard label="Valid Rows" value={validRowsCount} />
            <ValidationCard
              label="Issues Found"
              value={validationIssues.length}
              danger={validationIssues.length > 0}
            />
          </section>

          {validationIssues.length > 0 && (
            <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6">
              <h2 className="mb-3 text-lg font-semibold text-red-700">
                CSV Validation Issues
              </h2>
              <div className="max-h-64 overflow-y-auto rounded-xl bg-white">
                {validationIssues.slice(0, 20).map((issue, index) => (
                  <div
                    key={index}
                    className="border-b px-4 py-3 text-sm text-red-700"
                  >
                    Row {issue.row || "-"} | {issue.field}: {issue.message}
                  </div>
                ))}
              </div>
              {validationIssues.length > 20 && (
                <p className="mt-3 text-sm text-red-600">
                  Showing first 20 issues only.
                </p>
              )}
            </section>
          )}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                CSV Preview
              </h2>
              <p className="text-sm text-slate-500">Showing first 10 rows</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    {columns.map((column) => (
                      <th key={column} className="px-4 py-3">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {csvData.slice(0, 10).map((row, index) => (
                    <tr key={index}>
                      {columns.map((column) => (
                        <td key={column} className="px-4 py-3 text-slate-700">
                          {row[column] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {uploading && (
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-sm text-slate-600">
                  <span>Uploading shipments...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
              <button
                onClick={handleSubmit}
                disabled={uploading || validationIssues.length > 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {uploading && <Loader2 size={16} className="animate-spin" />}
                {uploading ? "Uploading..." : "Upload Shipments"}
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function ValidationCard({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        danger ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className={`text-sm ${danger ? "text-red-600" : "text-slate-500"}`}>
        {label}
      </p>
      <h3
        className={`mt-2 text-3xl font-bold ${
          danger ? "text-red-700" : "text-slate-900"
        }`}
      >
        {value}
      </h3>
    </div>
  );
}

function SuccessCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
      <p className="text-sm text-green-600">{label}</p>
      <h3 className="mt-2 break-words text-xl font-bold text-green-800">
        {value}
      </h3>
    </div>
  );
}
