import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import { 
  getRevenueByCategory, 
  getRevenueByAnimalType, 
  CategoryRevenue, 
  AnimalTypeRevenue 
} from "../../services/api/statisticsApi";

type ViewMode = "category" | "animal";

export default function CategoryRevenueChart() {
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<CategoryRevenue[]>([]);
  const [animalData, setAnimalData] = useState<AnimalTypeRevenue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("category");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catResult, animalResult] = await Promise.all([
          getRevenueByCategory(),
          getRevenueByAnimalType(),
        ]);
        setCategoryData(catResult);
        setAnimalData(animalResult);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch revenue data:", err);
        setError("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare chart data based on view mode
  const currentData = viewMode === "category" ? categoryData : animalData;
  const labels = currentData.map(d => 
    viewMode === "category" 
      ? (d as CategoryRevenue).categoryName 
      : (d as AnimalTypeRevenue).animalType
  );
  const revenues = currentData.map(d => d.totalRevenue);
  const quantities = currentData.map(d => d.totalQuantitySold);

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 300,
      stacked: false,
      toolbar: {
        show: false,
      },
    },
    colors: ["#465fff", "#22c55e"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: "60%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: labels,
      labels: {
        formatter: (val: string) => {
          const num = parseFloat(val);
          if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
          if (num >= 1000) return (num / 1000).toFixed(0) + "K";
          return val;
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    grid: {
      borderColor: "#e7e7e7",
      strokeDashArray: 3,
    },
    tooltip: {
      y: {
        formatter: (val: number, { seriesIndex }) => {
          if (seriesIndex === 0) {
            return new Intl.NumberFormat("vi-VN").format(val) + " đ";
          }
          return val + " sản phẩm";
        },
      },
    },
  };

  const series = [
    {
      name: "Doanh thu",
      data: revenues,
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="h-6 w-48 bg-gray-200 rounded dark:bg-gray-700 mb-4"></div>
        <div className="h-[300px] bg-gray-100 rounded dark:bg-gray-800"></div>
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
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Doanh thu theo {viewMode === "category" ? "danh mục" : "loại thú cưng"}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("category")}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              viewMode === "category"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Danh mục
          </button>
          <button
            onClick={() => setViewMode("animal")}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              viewMode === "animal"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Loại thú cưng
          </button>
        </div>
      </div>

      {currentData.length > 0 ? (
        <Chart options={options} series={series} type="bar" height={300} />
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-10">
          Chưa có dữ liệu
        </p>
      )}
    </div>
  );
}
