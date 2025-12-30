import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import { getOrderCountByStatus, OrderStatusCount } from "../../services/api/statisticsApi";

// Status labels in Vietnamese
const statusLabels: Record<string, string> = {
  WAITING_PAYMENT: "Chờ thanh toán",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

// Status colors
const statusColors: Record<string, string> = {
  WAITING_PAYMENT: "#f59e0b",
  PROCESSING: "#3b82f6",
  SHIPPED: "#8b5cf6",
  DELIVERED: "#10b981",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
};

export default function OrderStatusChart() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrderStatusCount[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getOrderCountByStatus();
        setData(result);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch order status:", err);
        setError("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const labels = data.map(d => statusLabels[d.status] || d.status);
  const counts = data.map(d => d.count);
  const colors = data.map(d => statusColors[d.status] || "#6b7280");

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 300,
    },
    colors: colors,
    labels: labels,
    legend: {
      show: true,
      position: "bottom",
      fontFamily: "Outfit",
      fontSize: "13px",
      labels: {
        colors: "#6b7280",
      },
    },
    tooltip: {
      theme: "light",
      fillSeriesColor: false,
      style: {
        fontSize: "13px",
      },
      y: {
        formatter: (val: number) => val + " đơn",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toFixed(1) + "%",
      style: {
        colors: ["#ffffff"],
        fontSize: "12px",
        fontWeight: 600,
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 2,
        opacity: 0.5,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              color: "#6b7280",
            },
            value: {
              show: true,
              fontSize: "24px",
              fontWeight: 700,
              color: "#1f2937",
            },
            total: {
              show: true,
              label: "Tổng đơn",
              fontSize: "14px",
              fontWeight: 600,
              color: "#6b7280",
              formatter: () => counts.reduce((a, b) => a + b, 0).toString(),
            },
          },
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 250,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="h-6 w-40 bg-gray-200 rounded dark:bg-gray-700 mb-4"></div>
        <div className="h-[250px] bg-gray-100 rounded-full mx-auto w-[200px] dark:bg-gray-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Đơn hàng theo trạng thái
      </h3>
      
      {data.length > 0 ? (
        <Chart options={options} series={counts} type="donut" height={300} />
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-10">
          Chưa có dữ liệu đơn hàng
        </p>
      )}
    </div>
  );
}
