import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { getTopSellingProducts, TopProduct } from "../../services/api/statisticsApi";

// Format currency
const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function TopProductsTable() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"quantity" | "revenue">("quantity");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getTopSellingProducts(5, sortBy);
        setProducts(result);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch top products:", err);
        setError("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sortBy]);

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="h-6 w-40 bg-gray-200 rounded dark:bg-gray-700 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded dark:bg-gray-800"></div>
          ))}
        </div>
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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Top sản phẩm bán chạy
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("quantity")}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              sortBy === "quantity"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Số lượng
          </button>
          <button
            onClick={() => setSortBy("revenue")}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              sortBy === "revenue"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Doanh thu
          </button>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  #
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Sản phẩm
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Danh mục
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400 min-w-[80px]"
                >
                  Đã bán
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400 min-w-[120px]"
                >
                  Doanh thu
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {products.map((product, idx) => (
                <TableRow key={product.productId}>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {product.productName}
                    </p>
                    {product.animalType && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {product.animalType}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {product.categoryName || "-"}
                  </TableCell>
                  <TableCell className="py-3 text-right font-medium text-gray-800 text-theme-sm dark:text-white/90 min-w-[80px]">
                    {product.totalQuantitySold}
                  </TableCell>
                  <TableCell className="py-3 text-right font-medium text-green-600 text-theme-sm dark:text-green-400 min-w-[120px]">
                    {formatCurrency(product.totalRevenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-10">
          Chưa có dữ liệu sản phẩm
        </p>
      )}
    </div>
  );
}
