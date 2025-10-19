import http from "./http";

export type CategoryPayload = {
  name: string;
  description?: string;
  isFeatured?: "0" | "1";
  isDeleted?: "0" | "1";
};

export const categoryApi = {
  // GET list with search/sort/pagination (1-based)
  list(
    params: {
      pageNumber: number;
      size: number;
      search?: string;
      sort?: string;
    },
    options?: { signal?: AbortSignal }
  ) {
    return http.get("/categories", { params, signal: options?.signal });
  },

  // POST form-urlencoded feature filter
  feature(
    params: {
      pageNumber: number;
      size: number;
      isFeature: "1" | "0";
      search?: string;
      sort?: string;
    },
    options?: { signal?: AbortSignal }
  ) {
    const form = new URLSearchParams();
    form.append("pageNumber", String(params.pageNumber));
    form.append("size", String(params.size));
    form.append("isFeature", params.isFeature);
    if (params.sort) form.append("sort", params.sort);
    if (params.search) form.append("search", params.search);
    return http.post("/categories/feature", form.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: options?.signal,
    });
  },

  // POST form-urlencoded deleted filter
  deleted(
    params: {
      pageNumber: number;
      size: number;
      isDeleted: "1" | "0";
      search?: string;
      sort?: string;
    },
    options?: { signal?: AbortSignal }
  ) {
    const form = new URLSearchParams();
    form.append("pageNumber", String(params.pageNumber));
    form.append("size", String(params.size));
    // Gửi cả isDeleted và isDelete để tương thích backend
    form.append("isDeleted", params.isDeleted);
    form.append("isDelete", params.isDeleted);
    if (params.sort) form.append("sort", params.sort);
    if (params.search) form.append("search", params.search);
    return http.post("/categories/delete", form.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: options?.signal,
    });
  },

  getById(id: number | string) {
    return http.get(`/categories/${id}`);
  },

  create(body: CategoryPayload) {
    return http.post("/categories", body);
  },

  update(id: number | string, body: CategoryPayload) {
    return http.put(`/categories/${id}`, body);
  },
};

export default categoryApi;
