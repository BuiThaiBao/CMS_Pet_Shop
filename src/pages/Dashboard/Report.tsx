import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import PageMeta from "../../components/common/PageMeta";
import {
  getDashboardSummary,
  getOrderCountByStatus,
  getMonthlyRevenue,
  getTopSellingProducts,
  getRevenueByCategory,
  getRevenueByAnimalType,
  getTopCustomers,
  getDailyRevenue,
  getWeeklyRevenue,
} from "../../services/api/statisticsApi";

// Status labels in Vietnamese
const statusLabels: Record<string, string> = {
  WAITING_PAYMENT: "Chờ thanh toán",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

type ReportType = 
  | "summary" 
  | "orders" 
  | "monthly" 
  | "daily"
  | "weekly"
  | "products" 
  | "category" 
  | "animal" 
  | "customers"
  | "all";

interface ReportParams {
  selectedMonth: number;
  selectedYear: number;
  productLimit: number;
  productSortBy: "quantity" | "revenue";
  customerLimit: number;
  startDate: string;
  endDate: string;
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

// Helper to format date as yyyy-MM-dd
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// Get start and end of current month
const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: formatDate(start), end: formatDate(end) };
};

export default function Report() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<ReportType | null>(null);
  const [message, setMessage] = useState<string>("");
  const [showModal, setShowModal] = useState<ReportType | null>(null);
  const monthRange = getMonthRange();
  const [params, setParams] = useState<ReportParams>({
    selectedMonth: currentMonth,
    selectedYear: currentYear,
    productLimit: 10,
    productSortBy: "revenue",
    customerLimit: 10,
    startDate: monthRange.start,
    endDate: monthRange.end,
  });

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const downloadExcel = (data: unknown[], filename: string, sheetName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportSummary = async () => {
    try {
      setLoading("summary");
      setShowModal(null);
      const data = await getDashboardSummary();
      downloadExcel([{
        "Tổng đơn hàng": data.totalOrders,
        "Tổng doanh thu (VNĐ)": data.totalRevenue,
        "Tổng khách hàng": data.totalCustomers,
        "Giá trị đơn TB (VNĐ)": data.avgOrderValue,
        "Số đơn đã thanh toán": data.paidOrderCount,
      }], "bao_cao_tong_quan", "Tổng quan");
      showMessage("Xuất báo cáo tổng quan thành công!");
    } catch (err) {
      showMessage("Lỗi xuất báo cáo: " + err);
    } finally {
      setLoading(null);
    }
  };

  const exportOrderStatus = async () => {
    try {
      setLoading("orders");
      setShowModal(null);
      const data = await getOrderCountByStatus();
      const formattedData = data.map(d => ({
        "Trạng thái": statusLabels[d.status] || d.status,
        "Số đơn": d.count,
      }));
      downloadExcel(formattedData, "bao_cao_trang_thai_don", "Trạng thái đơn");
      showMessage("Xuất báo cáo trạng thái đơn thành công!");
    } catch (err) {
      showMessage("Lỗi xuất báo cáo: " + err);
    } finally {
      setLoading(null);
    }
  };

  const exportMonthlyRevenue = async () => {
    try {
      setLoading("monthly");
      setShowModal(null);
      // Get all 12 months and filter for selected month/year
      const data = await getMonthlyRevenue(24);
      const filtered = data.filter(d => d.month === params.selectedMonth && d.year === params.selectedYear);
      const monthName = `Tháng ${params.selectedMonth}/${params.selectedYear}`;
      
      if (filtered.length === 0) {
        // No data for selected month, create empty row
        downloadExcel([{
          "Tháng": monthName,
          "Doanh thu (VNĐ)": 0,
          "Số đơn hàng": 0,
        }], `bao_cao_doanh_thu_thang_${params.selectedMonth}_${params.selectedYear}`, "Doanh thu tháng");
      } else {
        const formattedData = filtered.map(d => ({
          "Tháng": d.monthLabel || monthName,
          "Doanh thu (VNĐ)": d.revenue,
          "Số đơn hàng": d.orderCount,
        }));
        downloadExcel(formattedData, `bao_cao_doanh_thu_thang_${params.selectedMonth}_${params.selectedYear}`, "Doanh thu tháng");
      }
      showMessage(`Xuất báo cáo doanh thu ${monthName} thành công!`);
    } catch (err) {
      showMessage("Lỗi xuất báo cáo: " + err);
    } finally {
      setLoading(null);
    }
  };

  const exportTopProducts = async () => {
    try {
      setLoading("products");
      setShowModal(null);
      const data = await getTopSellingProducts(params.productLimit, params.productSortBy);
      const formattedData = data.map((d, idx) => ({
        "STT": idx + 1,
        "Tên sản phẩm": d.productName,
        "Danh mục": d.categoryName || "-",
        "Loại thú cưng": d.animalType || "-",
        "Số lượng bán": d.totalQuantitySold,
        "Doanh thu (VNĐ)": d.totalRevenue,
      }));
      const sortLabel = params.productSortBy === "revenue" ? "doanh_thu" : "so_luong";
      downloadExcel(formattedData, `bao_cao_top_${params.productLimit}_san_pham_${sortLabel}`, "Sản phẩm bán chạy");
      showMessage(`Xuất báo cáo top ${params.productLimit} sản phẩm thành công!`);
    } catch (err) {
      showMessage("Lỗi xuất báo cáo: " + err);
    } finally {
      setLoading(null);
    }
  };

  const exportCategoryRevenue = async () => {
    try {
      setLoading("category");
      setShowModal(null);
      const data = await getRevenueByCategory();
      const formattedData = data.map(d => ({
        "Danh mục": d.categoryName,
        "Doanh thu (VNĐ)": d.totalRevenue,
        "Số đơn hàng": d.orderCount,
        "Số lượng bán": d.totalQuantitySold,
      }));
      downloadExcel(formattedData, "bao_cao_doanh_thu_danh_muc", "Doanh thu danh mục");
      showMessage("Xuất báo cáo doanh thu theo danh mục thành công!");
    } catch (err) {
      showMessage("Lỗi xuất báo cáo: " + err);
    } finally {
      setLoading(null);
    }
  };

  const exportAnimalRevenue = async () => {
    try {
      setLoading("animal");
      setShowModal(null);
      const data = await getRevenueByAnimalType();
      const formattedData = data.map(d => ({
        "Loại thú cưng": d.animalType,
        "Doanh thu (VNĐ)": d.totalRevenue,
        "Số đơn hàng": d.orderCount,
        "Số lượng bán": d.totalQuantitySold,
      }));
      downloadExcel(formattedData, "bao_cao_doanh_thu_loai_thu_cung", "Doanh thu loại thú");
      showMessage("Xuất báo cáo doanh thu theo loại thú cưng thành công!");
    } catch (err) {
      showMessage("Lỗi xuất báo cáo: " + err);
    } finally {
      setLoading(null);
    }
  };

  const exportTopCustomers = async () => {
    try {
      setLoading("customers");
      setShowModal(null);
      const data = await getTopCustomers(params.customerLimit);
      const formattedData = data.map((d, idx) => ({
        "STT": idx + 1,
        "Tên khách hàng": d.customerName,
        "Email": d.email,
        "Số điện thoại": d.phone,
        "Tổng chi tiêu (VNĐ)": d.totalSpent,
        "Số đơn hàng": d.orderCount,
      }));
      downloadExcel(formattedData, `bao_cao_top_${params.customerLimit}_khach_hang`, "Khách hàng VIP");
      showMessage(`Xuất báo cáo top ${params.customerLimit} khách hàng thành công!`);
    } catch (err) {
      showMessage("Lỗi xuất báo cáo: " + err);
    } finally {
      setLoading(null);
    }
  };

  const exportDailyRevenue = async () => {
    try {
      setLoading("daily");
      setShowModal(null);
      const data = await getDailyRevenue(params.startDate, params.endDate);
      
      if (data.length === 0) {
        downloadExcel([{
          "Ngày": `${params.startDate} - ${params.endDate}`,
          "Doanh thu (VNĐ)": 0,
          "Số đơn hàng": 0,
        }], `bao_cao_doanh_thu_theo_ngay`, "Doanh thu theo ngày");
      } else {
        const formattedData = data.map(d => ({
          "Ngày": d.dateLabel,
          "Doanh thu (VNĐ)": d.revenue,
          "Số đơn hàng": d.orderCount,
        }));
        downloadExcel(formattedData, `bao_cao_doanh_thu_theo_ngay`, "Doanh thu theo ngày");
      }
      showMessage(`Xuất báo cáo doanh thu theo ngày thành công!`);
    } catch (err) {
      showMessage("Lỗi xuất báo cáo: " + err);
    } finally {
      setLoading(null);
    }
  };

  const exportWeeklyRevenue = async () => {
    try {
      setLoading("weekly");
      setShowModal(null);
      const data = await getWeeklyRevenue(params.startDate, params.endDate);
      
      if (data.length === 0) {
        downloadExcel([{
          "Tuần": `${params.startDate} - ${params.endDate}`,
          "Doanh thu (VNĐ)": 0,
          "Số đơn hàng": 0,
        }], `bao_cao_doanh_thu_theo_tuan`, "Doanh thu theo tuần");
      } else {
        const formattedData = data.map(d => ({
          "Tuần": d.weekLabel,
          "Doanh thu (VNĐ)": d.revenue,
          "Số đơn hàng": d.orderCount,
        }));
        downloadExcel(formattedData, `bao_cao_doanh_thu_theo_tuan`, "Doanh thu theo tuần");
      }
      showMessage(`Xuất báo cáo doanh thu theo tuần thành công!`);
    } catch (err) {
      showMessage("Lỗi xuất báo cáo: " + err);
    } finally {
      setLoading(null);
    }
  };

  const exportAll = async () => {
    try {
      setLoading("all");
      setShowModal(null);
      
      const [summary, orders, monthly, products, categories, animals, customers] = await Promise.all([
        getDashboardSummary(),
        getOrderCountByStatus(),
        getMonthlyRevenue(12),
        getTopSellingProducts(params.productLimit, params.productSortBy),
        getRevenueByCategory(),
        getRevenueByAnimalType(),
        getTopCustomers(params.customerLimit),
      ]);

      const workbook = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summarySheet = XLSX.utils.json_to_sheet([{
        "Tổng đơn hàng": summary.totalOrders,
        "Tổng doanh thu (VNĐ)": summary.totalRevenue,
        "Tổng khách hàng": summary.totalCustomers,
        "Giá trị đơn TB (VNĐ)": summary.avgOrderValue,
        "Số đơn đã thanh toán": summary.paidOrderCount,
      }]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Tổng quan");

      // Sheet 2: Order Status
      const ordersSheet = XLSX.utils.json_to_sheet(orders.map(d => ({
        "Trạng thái": statusLabels[d.status] || d.status,
        "Số đơn": d.count,
      })));
      XLSX.utils.book_append_sheet(workbook, ordersSheet, "Trạng thái đơn");

      // Sheet 3: Monthly Revenue
      const monthlySheet = XLSX.utils.json_to_sheet(monthly.map(d => ({
        "Tháng": d.monthLabel,
        "Doanh thu (VNĐ)": d.revenue,
        "Số đơn hàng": d.orderCount,
      })));
      XLSX.utils.book_append_sheet(workbook, monthlySheet, "Doanh thu tháng");

      // Sheet 4: Top Products
      const productsSheet = XLSX.utils.json_to_sheet(products.map((d, idx) => ({
        "STT": idx + 1,
        "Tên sản phẩm": d.productName,
        "Danh mục": d.categoryName || "-",
        "Số lượng bán": d.totalQuantitySold,
        "Doanh thu (VNĐ)": d.totalRevenue,
      })));
      XLSX.utils.book_append_sheet(workbook, productsSheet, "Sản phẩm");

      // Sheet 5: Category Revenue
      const categorySheet = XLSX.utils.json_to_sheet(categories.map(d => ({
        "Danh mục": d.categoryName,
        "Doanh thu (VNĐ)": d.totalRevenue,
        "Số đơn hàng": d.orderCount,
      })));
      XLSX.utils.book_append_sheet(workbook, categorySheet, "Danh mục");

      // Sheet 6: Animal Revenue
      const animalSheet = XLSX.utils.json_to_sheet(animals.map(d => ({
        "Loại thú cưng": d.animalType,
        "Doanh thu (VNĐ)": d.totalRevenue,
        "Số đơn hàng": d.orderCount,
      })));
      XLSX.utils.book_append_sheet(workbook, animalSheet, "Loại thú cưng");

      // Sheet 7: Top Customers
      const customersSheet = XLSX.utils.json_to_sheet(customers.map((d, idx) => ({
        "STT": idx + 1,
        "Tên khách hàng": d.customerName,
        "Email": d.email,
        "Tổng chi tiêu (VNĐ)": d.totalSpent,
        "Số đơn hàng": d.orderCount,
      })));
      XLSX.utils.book_append_sheet(workbook, customersSheet, "Khách hàng VIP");

      XLSX.writeFile(workbook, `bao_cao_tong_hop_${new Date().toISOString().split("T")[0]}.xlsx`);
      showMessage("Xuất báo cáo tổng hợp thành công!");
    } catch (err) {
      showMessage("Lỗi xuất báo cáo: " + err);
    } finally {
      setLoading(null);
    }
  };

  // Determine if report type needs params
  const needsParams = (type: ReportType): boolean => {
    return ["monthly", "daily", "weekly", "products", "customers", "all"].includes(type);
  };

  const handleExportClick = (type: ReportType, exportFn: () => void) => {
    if (needsParams(type)) {
      setShowModal(type);
    } else {
      exportFn();
    }
  };

  const reports = [
    { id: "all" as ReportType, name: "Báo cáo tổng hợp", desc: "Tất cả thống kê (nhiều sheet)", action: exportAll, icon: "📊", hasParams: true },
    { id: "summary" as ReportType, name: "Tổng quan Dashboard", desc: "Tổng đơn, doanh thu, khách hàng", action: exportSummary, icon: "📈", hasParams: false },
    { id: "orders" as ReportType, name: "Trạng thái đơn hàng", desc: "Số đơn theo từng trạng thái", action: exportOrderStatus, icon: "📦", hasParams: false },
    { id: "daily" as ReportType, name: "Doanh thu theo ngày", desc: "Doanh thu từng ngày (chọn khoảng)", action: exportDailyRevenue, icon: "📆", hasParams: true },
    { id: "weekly" as ReportType, name: "Doanh thu theo tuần", desc: "Doanh thu từng tuần (chọn khoảng)", action: exportWeeklyRevenue, icon: "📅", hasParams: true },
    { id: "monthly" as ReportType, name: "Doanh thu theo tháng", desc: "Doanh thu tháng cụ thể", action: exportMonthlyRevenue, icon: "🗓️", hasParams: true },
    { id: "products" as ReportType, name: "Sản phẩm bán chạy", desc: "Top N sản phẩm", action: exportTopProducts, icon: "🏆", hasParams: true },
    { id: "category" as ReportType, name: "Doanh thu theo danh mục", desc: "Phân tích doanh thu từng danh mục", action: exportCategoryRevenue, icon: "🗂️", hasParams: false },
    { id: "animal" as ReportType, name: "Doanh thu theo loại thú", desc: "Phân tích theo loại thú cưng", action: exportAnimalRevenue, icon: "🐕", hasParams: false },
    { id: "customers" as ReportType, name: "Khách hàng VIP", desc: "Top N khách hàng chi tiêu cao", action: exportTopCustomers, icon: "👑", hasParams: true },
  ];

  const renderModal = () => {
    if (!showModal) return null;

    const report = reports.find(r => r.id === showModal);
    if (!report) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            {report.icon} {report.name}
          </h3>
          
          <div className="space-y-4">
            {/* Daily/Weekly Revenue Params - Date Range */}
            {(showModal === "daily" || showModal === "weekly") && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={params.startDate}
                    onChange={(e) => setParams({ ...params, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={params.endDate}
                    onChange={(e) => setParams({ ...params, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Monthly Revenue Params */}
            {(showModal === "monthly") && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tháng
                  </label>
                  <select
                    value={params.selectedMonth}
                    onChange={(e) => setParams({ ...params, selectedMonth: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value={1}>Tháng 1</option>
                    <option value={2}>Tháng 2</option>
                    <option value={3}>Tháng 3</option>
                    <option value={4}>Tháng 4</option>
                    <option value={5}>Tháng 5</option>
                    <option value={6}>Tháng 6</option>
                    <option value={7}>Tháng 7</option>
                    <option value={8}>Tháng 8</option>
                    <option value={9}>Tháng 9</option>
                    <option value={10}>Tháng 10</option>
                    <option value={11}>Tháng 11</option>
                    <option value={12}>Tháng 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Năm
                  </label>
                  <select
                    value={params.selectedYear}
                    onChange={(e) => setParams({ ...params, selectedYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {Array.from({ length: 10 }, (_, i) => currentYear - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Product Params */}
            {(showModal === "products" || showModal === "all") && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Số lượng sản phẩm
                  </label>
                  <select
                    value={params.productLimit}
                    onChange={(e) => setParams({ ...params, productLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value={5}>Top 5</option>
                    <option value={10}>Top 10</option>
                    <option value={20}>Top 20</option>
                    <option value={50}>Top 50</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sắp xếp theo
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sortBy"
                        checked={params.productSortBy === "revenue"}
                        onChange={() => setParams({ ...params, productSortBy: "revenue" })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Doanh thu</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="sortBy"
                        checked={params.productSortBy === "quantity"}
                        onChange={() => setParams({ ...params, productSortBy: "quantity" })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Số lượng</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Customer Params */}
            {(showModal === "customers" || showModal === "all") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Số lượng khách hàng
                </label>
                <select
                  value={params.customerLimit}
                  onChange={(e) => setParams({ ...params, customerLimit: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                  <option value={50}>Top 50</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowModal(null)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={report.action}
              disabled={loading !== null}
              className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t('dashboard.exporting') : `📥 ${t('dashboard.exportExcel')}`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageMeta
        title={t('dashboard.reportTitle')}
        description={t('dashboard.reportDescription')}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Xuất báo cáo Excel
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Chọn loại báo cáo để xuất file Excel
            </p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${message.includes("Lỗi") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-lg transition"
            >
              <div className="text-3xl mb-3">{report.icon}</div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                {report.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {report.desc}
              </p>
              <button
                onClick={() => handleExportClick(report.id, report.action)}
                disabled={loading !== null}
                className={`w-full px-4 py-2 rounded-lg text-white font-medium transition ${
                  loading === report.id
                    ? "bg-gray-400 cursor-wait"
                    : "bg-blue-600 hover:bg-blue-700"
                } disabled:opacity-50`}
              >
                {loading === report.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xuất...
                  </span>
                ) : (
                  <>📥 {t('dashboard.exportExcel')}</>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {renderModal()}
    </>
  );
}
