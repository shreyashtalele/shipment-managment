"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getShipmentSummary,
  getAverageDeliveryTime,
  getProviderWiseCount,
  getStatusTrend,
  getTopRoutes,
} from "@/api/analytics";

import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Route,
  BarChart3,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnyObj = Record<string, any>;

const chartColors = ["#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#ef4444"];

const formatText = (text: string) =>
  text.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const getAvgDays = (data: any) => {
  if (typeof data === "number") return data;
  if (typeof data === "string") return Number(data) || 0;
  return (
    Number(data?.average_delivery_time) ||
    Number(data?.avg_delivery_time) ||
    Number(data?.days) ||
    0
  );
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnyObj>({});
  const [avgDeliveryTime, setAvgDeliveryTime] = useState(0);
  const [providerData, setProviderData] = useState<AnyObj[]>([]);
  const [statusTrend, setStatusTrend] = useState<AnyObj[]>([]);
  const [topRoutes, setTopRoutes] = useState<AnyObj[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [summaryRes, avgRes, providerRes, statusRes, routesRes] =
          await Promise.all([
            getShipmentSummary(),
            getAverageDeliveryTime(),
            getProviderWiseCount(),
            getStatusTrend(),
            getTopRoutes(),
          ]);

        setSummary(summaryRes || {});
        setAvgDeliveryTime(getAvgDays(avgRes));

        setProviderData(
          Object.entries(providerRes || {}).map(([provider, count]) => ({
            provider: formatText(provider),
            count: Number(count) || 0,
          })),
        );

        setStatusTrend(
          Object.entries(statusRes || {}).map(([date, statuses]: any) => ({
            date,
            ...(statuses || {}),
          })),
        );

        setTopRoutes(
          Object.entries(routesRes || {}).map(([route, count]) => ({
            route,
            count: Number(count) || 0,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const totalShipments =
    summary.total ||
    summary.total_shipments ||
    Object.values(summary).reduce((sum, value) => sum + Number(value || 0), 0);

  const cards = useMemo(
    () => [
      {
        title: "Total Shipments",
        value: totalShipments,
        icon: Package,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        title: "Delivered",
        value: summary.delivered || 0,
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
      {
        title: "In Transit",
        value: summary.in_transit || summary.intransit || 0,
        icon: Truck,
        color: "text-violet-600",
        bg: "bg-violet-50",
      },
      {
        title: "Delayed / Failed",
        value:
          (summary.delayed || 0) +
          (summary.failed || 0) +
          (summary.cancelled || 0),
        icon: AlertCircle,
        color: "text-orange-600",
        bg: "bg-orange-50",
      },
    ],
    [summary, totalShipments],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="h-10 w-72 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-6 grid grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of shipment performance, providers, routes and delivery
            status.
          </p>
        </div>

        <div className="rounded-2xl border bg-white px-5 py-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Average Delivery</p>
          <p className="text-2xl font-bold text-blue-600">
            {avgDeliveryTime} days
          </p>
        </div>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.title}
              className="rounded-2xl border bg-white shadow-sm"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.title}
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-slate-900">
                      {item.value}
                    </h2>
                  </div>

                  <div className={`rounded-xl ${item.bg} p-3`}>
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl border bg-white shadow-sm xl:col-span-2">
          <CardContent className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Provider Wise Shipments
                </h2>
                <p className="text-sm text-slate-500">
                  Total shipments handled by each provider
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={providerData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="provider" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {providerData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Top Routes
                </h2>
                <p className="text-sm text-slate-500">
                  Most used shipment routes
                </p>
              </div>
              <Route className="h-5 w-5 text-orange-600" />
            </div>

            <div className="space-y-3">
              {topRoutes.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.route}
                    </p>
                    <p className="text-xs text-slate-500">Shipment route</p>
                  </div>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl border bg-white shadow-sm xl:col-span-2">
          <CardContent className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Status Trend
                </h2>
                <p className="text-sm text-slate-500">
                  Shipment status changes over time
                </p>
              </div>
              <Truck className="h-5 w-5 text-violet-600" />
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={statusTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stroke="#16a34a"
                  fill="#dcfce7"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="in_transit"
                  stroke="#2563eb"
                  fill="#dbeafe"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stroke="#f59e0b"
                  fill="#fef3c7"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="delayed"
                  stroke="#ef4444"
                  fill="#fee2e2"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Delivery Performance
                </h2>
                <p className="text-sm text-slate-500">
                  Average shipment delivery time
                </p>
              </div>
              <Clock className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="rounded-2xl bg-blue-50 p-6 text-center">
              <p className="text-sm font-medium text-blue-700">
                Average Delivery Time
              </p>
              <p className="mt-3 text-5xl font-bold text-blue-700">
                {avgDeliveryTime}
              </p>
              <p className="mt-1 text-sm font-medium text-blue-700">days</p>
            </div>

            <div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
              {avgDeliveryTime <= 3
                ? "Delivery performance is excellent."
                : avgDeliveryTime <= 6
                  ? "Delivery performance is average."
                  : "Delivery performance needs improvement."}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
