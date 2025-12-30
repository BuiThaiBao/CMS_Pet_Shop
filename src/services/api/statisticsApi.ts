import axios from "axios";
import { getToken } from "./tokenStorage";

// ==================== TYPES ====================

export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  avgOrderValue: number;
  paidOrderCount: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  monthLabel: string;
  revenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  categoryName: string | null;
  animalType: string | null;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface CategoryRevenue {
  categoryId: number | null;
  categoryName: string;
  totalRevenue: number;
  orderCount: number;
  totalQuantitySold: number;
}

export interface AnimalTypeRevenue {
  animalType: string;
  totalRevenue: number;
  orderCount: number;
  totalQuantitySold: number;
}

export interface TopCustomer {
  userId: number;
  customerName: string;
  email: string;
  phone: string;
  totalSpent: number;
  orderCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  result: T;
}

// ==================== HTTP INSTANCE ====================
// Statistics API is at /api/admin/statistics (not /api/v1)
// Create a separate instance without v1 prefix
const statisticsHttp = axios.create({
  baseURL: "http://localhost:8080/api",
});

statisticsHttp.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

const STATISTICS_BASE = "/admin/statistics";

// ==================== API CALLS ====================

/**
 * Get dashboard summary statistics
 */
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await statisticsHttp.get<ApiResponse<DashboardSummary>>(
    `${STATISTICS_BASE}/summary`
  );
  return response.data.result;
};

/**
 * Get order count by status
 */
export const getOrderCountByStatus = async (): Promise<OrderStatusCount[]> => {
  const response = await statisticsHttp.get<ApiResponse<OrderStatusCount[]>>(
    `${STATISTICS_BASE}/orders/by-status`
  );
  return response.data.result;
};

/**
 * Get monthly revenue for the last N months
 */
export const getMonthlyRevenue = async (
  months: number = 12
): Promise<MonthlyRevenue[]> => {
  const response = await statisticsHttp.get<ApiResponse<MonthlyRevenue[]>>(
    `${STATISTICS_BASE}/revenue/monthly`,
    { params: { months } }
  );
  return response.data.result;
};

/**
 * Get top selling products
 */
export const getTopSellingProducts = async (
  limit: number = 5,
  sortBy: "quantity" | "revenue" = "quantity"
): Promise<TopProduct[]> => {
  const response = await statisticsHttp.get<ApiResponse<TopProduct[]>>(
    `${STATISTICS_BASE}/products/top-selling`,
    { params: { limit, sortBy } }
  );
  return response.data.result;
};

/**
 * Get revenue by category
 */
export const getRevenueByCategory = async (): Promise<CategoryRevenue[]> => {
  const response = await statisticsHttp.get<ApiResponse<CategoryRevenue[]>>(
    `${STATISTICS_BASE}/revenue/by-category`
  );
  return response.data.result;
};

/**
 * Get revenue by animal type
 */
export const getRevenueByAnimalType = async (): Promise<AnimalTypeRevenue[]> => {
  const response = await statisticsHttp.get<ApiResponse<AnimalTypeRevenue[]>>(
    `${STATISTICS_BASE}/revenue/by-animal-type`
  );
  return response.data.result;
};

/**
 * Get top customers by spending
 */
export const getTopCustomers = async (
  limit: number = 5
): Promise<TopCustomer[]> => {
  const response = await statisticsHttp.get<ApiResponse<TopCustomer[]>>(
    `${STATISTICS_BASE}/customers/top`,
    { params: { limit } }
  );
  return response.data.result;
};
