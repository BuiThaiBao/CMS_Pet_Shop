import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { getTopCustomers, TopCustomer } from "../../services/api/statisticsApi";

// Format currency
const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function TopCustomersTable() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getTopCustomers(5);
        setCustomers(result);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch top customers:", err);
        setError("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
          Khách hàng VIP
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Top 5 chi tiêu cao nhất
        </span>
      </div>

      {customers.length > 0 ? (
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
                  Khách hàng
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400"
                >
                  Số đơn
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400"
                >
                  Tổng chi tiêu
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {customers.map((customer, idx) => (
                <TableRow key={customer.userId}>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      idx === 0 ? "bg-yellow-100 text-yellow-700" :
                      idx === 1 ? "bg-gray-100 text-gray-600" :
                      idx === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-50 text-gray-500"
                    }`}>
                      {idx + 1}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {customer.customerName}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {customer.email}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right text-gray-600 text-theme-sm dark:text-gray-300">
                    {customer.orderCount} đơn
                  </TableCell>
                  <TableCell className="py-3 text-right font-semibold text-green-600 text-theme-sm dark:text-green-400">
                    {formatCurrency(customer.totalSpent)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-10">
          Chưa có dữ liệu khách hàng
        </p>
      )}
    </div>
  );
}
