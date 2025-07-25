import { getAccessToken } from "./auth";

const BASE_URL = "http://localhost:8000/analytics";

/**
 * Helper to fetch with Authorization header
 */
const fetchWithAuth = async (endpoint: string) => {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Unauthorized: No token found.");
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to fetch analytics");
  }

  return res.json();
};

/**
 * Get shipment summary counts
 */
export const getShipmentSummary = async () => {
  return await fetchWithAuth("/summary");
};

/**
 * Get monthly shipment trends
 */
export const getMonthlyTrends = async () => {
  return await fetchWithAuth("/monthly-trends");
};

/**
 * Get average delivery time
 */
export const getAverageDeliveryTime = async () => {
  return await fetchWithAuth("/average-delivery-time");
};

/**
 * Get provider-wise shipment count
 */
export const getProviderWiseCount = async () => {
  return await fetchWithAuth("/provider-count");
};

/**
 * Get status trend over time
 */
export const getStatusTrend = async () => {
  return await fetchWithAuth("/status-trend");
};

/**
 * Get top 5 popular shipment routes
 */
export const getTopRoutes = async () => {
  return await fetchWithAuth("/top-routes");
};
