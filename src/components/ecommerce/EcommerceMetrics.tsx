import { useEffect, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { getDashboardSummary, DashboardSummary } from "../../services/api/statisticsApi";

// Format number with Vietnamese locale
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("vi-VN").format(num);
};

// Format currency
const formatCurrency = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + " tỷ";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + " tr";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + "K";
  }
  return formatNumber(num);
};

export default function EcommerceMetrics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const summary = await getDashboardSummary();
        setData(summary);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dashboard summary:", err);
        setError("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
          >
            <div className="h-12 w-12 bg-gray-200 rounded-xl dark:bg-gray-700"></div>
            <div className="mt-5 space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded dark:bg-gray-700"></div>
              <div className="h-8 w-28 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">{error || "Lỗi tải dữ liệu"}</p>
      </div>
    );
  }

  const metrics = [
    {
      icon: <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />,
      label: "Khách hàng",
      value: formatNumber(data.totalCustomers),
      trend: null,
    },
    {
      icon: <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />,
      label: "Đơn hàng",
      value: formatNumber(data.totalOrders),
      trend: null,
    },
    {
      icon: (
        <svg className="size-6 text-gray-800 dark:text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Doanh thu",
      value: formatCurrency(data.totalRevenue),
      trend: { up: true, value: `${data.paidOrderCount} đơn` },
    },
    {
      icon: (
        <svg className="size-6 text-gray-800 dark:text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      label: "Giá trị TB",
      value: formatCurrency(data.avgOrderValue),
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            {metric.icon}
          </div>

          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {metric.label}
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {metric.value}
              </h4>
            </div>
            {metric.trend && (
              <Badge color={metric.trend.up ? "success" : "error"}>
                {metric.trend.up ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {metric.trend.value}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
