const BASE_URL = "http://localhost:8000";

export type ShippingProviderData = {
  name: string;
  display_name?: string;
  tracking_url?: string;
  contact_email?: string;
  phone?: string;
};

export type ShippingProvider = ShippingProviderData & {
  id: string;
  created_by: string;
};

type APIResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; message: string };

/**
 * Get all shipping providers
 */
export const getAllShippingProviders = async (
  token: string
): Promise<APIResponse<ShippingProvider[]>> => {
  try {
    const res = await fetch(`${BASE_URL}/providers/list-provider`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      return {
        status: "error",
        message: error.detail || "Failed to fetch providers",
      };
    }

    const data = await res.json();
    return { status: "success", data };
  } catch (err) {
    return { status: "error", message: "Network error" };
  }
};

/**
 * Create a new shipping provider
 */
export const createShippingProvider = async (
  token: string,
  data: ShippingProviderData
): Promise<APIResponse<ShippingProvider>> => {
  try {
    const res = await fetch(`${BASE_URL}/providers/create-provider`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      return {
        status: "error",
        message: error.detail || "Failed to create provider",
      };
    }

    const responseData = await res.json();
    return { status: "success", data: responseData };
  } catch (err) {
    return { status: "error", message: "Network error" };
  }
};

/**
 * Update a shipping provider
 */
export const updateShippingProvider = async (
  token: string,
  id: string,
  data: ShippingProviderData
): Promise<APIResponse<ShippingProvider>> => {
  try {
    const res = await fetch(`${BASE_URL}/providers/patch-provider/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      return {
        status: "error",
        message: error.detail || "Failed to update provider",
      };
    }

    const responseData = await res.json();
    return { status: "success", data: responseData };
  } catch (err) {
    return { status: "error", message: "Network error" };
  }
};
