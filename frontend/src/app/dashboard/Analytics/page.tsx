"use client";

import {
  getShipmentSummary,
  getMonthlyTrends,
  getAverageDeliveryTime,
  getProviderWiseCount,
  getStatusTrend,
  getTopRoutes,
} from "@/api/analytics";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const AnalyticsPage = () => {
  const [summary, setSummary] = useState<any>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [avgDeliveryTime, setAvgDeliveryTime] = useState<number>(0);
  const [providerData, setProviderData] = useState<any[]>([]);
  const [statusTrend, setStatusTrend] = useState<any[]>([]);
  const [topRoutes, setTopRoutes] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [
          summaryRes,
          trendsRes,
          avgRes,
          providerRes,
          statusRes,
          routesRes,
        ] = await Promise.all([
          getShipmentSummary(),
          getMonthlyTrends(),
          getAverageDeliveryTime(),
          getProviderWiseCount(),
          getStatusTrend(),
          getTopRoutes(),
        ]);

        setSummary(summaryRes);
        setAvgDeliveryTime(avgRes);

        setMonthlyTrends(
          Object.entries(trendsRes).map(([month, count]) => ({
            month: new Date(2025, parseInt(month) - 1, 1).toLocaleString(
              "default",
              { month: "short" }
            ),
            count,
          }))
        );

        setProviderData(
          Object.entries(providerRes).map(([provider, count]) => ({
            provider,
            count,
          }))
        );

        setTopRoutes(
          Object.entries(routesRes).map(([route, count]) => ({
            route,
            count,
          }))
        );

        setStatusTrend(
          Object.entries(statusRes).map(([date, statuses]) => ({
            date,
            ...statuses,
          }))
        );
      } catch (err) {
        console.error("❌ Failed to fetch analytics:", err);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {summary &&
          Object.entries(summary).map(([key, value]) => (
            <Card
              key={key}
              className="text-center shadow-sm border rounded-2xl"
            >
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 capitalize">
                  {key.replace("_", " ")}
                </div>
                <div className="text-2xl font-semibold">{value}</div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Monthly Trends */}
      <Card className="shadow-sm border rounded-2xl">
        <CardContent>
          <h2 className="text-lg font-semibold mb-2">
            Monthly Shipment Trends
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyTrends}>
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Avg Delivery Time */}
        <Card className="shadow-sm border rounded-2xl">
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">
              Average Delivery Time
            </h2>
            <p className="text-4xl font-bold text-blue-600">
              {avgDeliveryTime} days
            </p>
          </CardContent>
        </Card>

        {/* Provider Chart */}
        <Card className="shadow-sm border rounded-2xl">
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">
              Shipments by Provider
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={providerData}>
                <XAxis dataKey="provider" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Trend */}
      <Card className="shadow-sm border rounded-2xl">
        <CardContent>
          <h2 className="text-lg font-semibold mb-2">Status Trend Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={statusTrend}>
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="delivered"
                stackId="1"
                stroke="#22c55e"
                fill="#dcfce7"
              />
              <Area
                type="monotone"
                dataKey="pending"
                stackId="1"
                stroke="#facc15"
                fill="#fef9c3"
              />
              <Area
                type="monotone"
                dataKey="in_transit"
                stackId="1"
                stroke="#3b82f6"
                fill="#dbeafe"
              />
              <Area
                type="monotone"
                dataKey="delayed"
                stackId="1"
                stroke="#f97316"
                fill="#ffedd5"
              />
              <Area
                type="monotone"
                dataKey="cancelled"
                stackId="1"
                stroke="#ef4444"
                fill="#fee2e2"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Routes */}
      <Card className="shadow-sm border rounded-2xl">
        <CardContent>
          <h2 className="text-lg font-semibold mb-2">Top Shipment Routes</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topRoutes}>
              <XAxis dataKey="route" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
