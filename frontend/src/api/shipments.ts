const BASE_URL = "http://localhost:8000";

const formatApiError = (error: any): string => {
  if (!error) return "Something went wrong";

  if (typeof error === "string") return error;

  if (Array.isArray(error)) {
    return error
      .map((item) => {
        if (typeof item === "string") return item;

        if (item?.msg) {
          const field = Array.isArray(item.loc)
            ? item.loc.join(" → ")
            : "field";

          return `${field}: ${item.msg}`;
        }

        return JSON.stringify(item);
      })
      .join(", ");
  }

  if (typeof error === "object") {
    if (error.detail) return formatApiError(error.detail);
    if (error.message) return formatApiError(error.message);
    if (error.msg) return error.msg;

    return JSON.stringify(error);
  }

  return "Something went wrong";
};

/**
 * Fetch all shipments
 */
export const getAllShipments = async (token: string) => {
  const res = await fetch(`${BASE_URL}/shipments/list-shipments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(formatApiError(json));
  }

  return json;
};

/**
 * Fetch a shipment by its ID
 */
export const getShipmentById = async (id: string, token: string) => {
  const res = await fetch(`${BASE_URL}/shipments/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(formatApiError(json));
  }

  return json;
};

/**
 * Fetch analytics summary
 */
export const getAnalyticsSummary = async (token: string) => {
  const res = await fetch(`${BASE_URL}/analytics/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(formatApiError(json));
  }

  return json;
};

/**
 * Update shipment status / estimated delivery
 */
export const updateShipmentStatus = async (
  id: string,
  token: string,
  payload: {
    status: string;
    estimated_delivery?: string;
  },
) => {
  const res = await fetch(`${BASE_URL}/shipments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(formatApiError(json));
  }

  return json;
};

export type ShipmentPayload = {
  origin: string;
  destination: string;
  status?: string;
  provider_id: string;
  estimated_delivery?: string;
  weight_kg?: number;
  dimensions?: string;
  description?: string;
  external_tracking_id?: string;
};

type APIResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; message: string };

/**
 * Create shipments in bulk
 */
export const createBulkShipments = async (
  token: string,
  shipments: ShipmentPayload[],
): Promise<APIResponse<string>> => {
  try {
    const res = await fetch(`${BASE_URL}/shipments/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(shipments),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        status: "error",
        message: formatApiError(json),
      };
    }

    return {
      status: "success",
      data: "Shipments uploaded successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Network error",
    };
  }
};
export const deleteShipment = async (id: string, token: string) => {
  const res = await fetch(`${BASE_URL}/shipments/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(formatApiError(json));
  }

  return json;
};

export const exportShipmentsCsv = async (token: string) => {
  const res = await fetch(`${BASE_URL}/shipments/export/csv`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(formatApiError(error));
  }

  return res.blob();
};

export const searchShipments = async (
  token: string,
  filters: {
    origin?: string;
    destination?: string;
    status?: string;
    provider_id?: string;
    date_from?: string;
    date_to?: string;
  },
) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });

  const res = await fetch(`${BASE_URL}/shipments/search?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(formatApiError(json));
  }

  return json;
};
