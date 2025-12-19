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

  updateStatus(data: any) {
    return http.put(`/orders/update-status`, data);
  },
};

export default orderApi;

//
