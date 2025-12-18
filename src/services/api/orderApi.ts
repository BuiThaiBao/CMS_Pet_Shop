// services/api/orderApi.ts
import http from "./http";

export const orderApi = {
  list(
    params: {
      pageNumber: number; // 1-based
      size: number;
      orderCode?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
    },
    options?: { signal?: AbortSignal }
  ) {
    return http.get("/orders/admin/orders", {
      params,
      signal: options?.signal,
    });
  },

  updateStatus(id: number, status: string) {
    return http.patch(`/orders/admin/orders/${id}/status`, { status });
  },
};

export default orderApi;

//
