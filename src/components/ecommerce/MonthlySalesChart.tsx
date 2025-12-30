import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import { getMonthlyRevenue, MonthlyRevenue } from "../../services/api/statisticsApi";

// Format currency for chart
const formatCurrency = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + "K";
  }
  return num.toString();
};

// Month names in Vietnamese
const monthNames = [
  "T1", "T2", "T3", "T4", "T5", "T6",
  "T7", "T8", "T9", "T10", "T11", "T12"
];

export default function MonthlySalesChart() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MonthlyRevenue[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getMonthlyRevenue(12);
        // Sort by year and month ascending
        const sorted = [...result].sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
        setData(sorted);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch monthly revenue:", err);
        setError("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare chart data
  const categories = data.map(d => monthNames[d.month - 1] + "/" + (d.year % 100));
  const revenueData = data.map(d => d.revenue);

  const options: ApexOptions = {
    colors: ["#465fff", "#22c55e"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: categories.length > 0 ? categories : monthNames,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: [
      {
        labels: {
          formatter: (val: number) => formatCurrency(val),
          style: {
            fontSize: "12px",
          },
        },
      },
    ],
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val: number, { seriesIndex }) => {
          if (seriesIndex === 0) {
            return new Intl.NumberFormat("vi-VN").format(val) + " đ";
          }
          return val + " đơn";
        },
      },
    },
  };

  const series = [
    {
      name: "Doanh thu",
      data: revenueData.length > 0 ? revenueData : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="h-6 w-32 bg-gray-200 rounded dark:bg-gray-700 mb-4"></div>
        <div className="h-[180px] bg-gray-100 rounded dark:bg-gray-800"></div>
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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Doanh thu theo tháng
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          12 tháng gần nhất
        </span>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}
