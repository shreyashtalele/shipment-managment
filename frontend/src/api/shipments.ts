// src/api/shipments.ts

const BASE_URL = "http://localhost:8000";

/**
 * Fetch all shipments
 */
export const getAllShipments = async (token: string) => {
  const res = await fetch(`${BASE_URL}/shipments/list-shipments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to fetch shipments");
  }

  return res.json();
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

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to fetch shipment");
  }

  return res.json();
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

  if (!res.ok) {
    throw new Error("Failed to fetch analytics summary");
  }

  return res.json();
};
