import http from "./http";

export type ProductPayload = {
  name: string;
  shortDescription?: string;
  description?: string;
  price?: number | string;
  soldQuantity?: number | string;
  stock?: number | string; // fallback key, if backend accepts
  stockQuantity?: number | string; // primary key per API example
  isFeatured?: "0" | "1";
  isDeleted?: "0" | "1";
  categoryId?: number | string; // Keep for backward compatibility
  categoryName?: string; // New field
};

export const productApi = {
  // GET list with search/sort/pagination (1-based)
  list(
    params: {
      pageNumber: number;
      size: number;
      search?: string;
      sort?: string;
      categoryId?: number | string;
    },
    options?: { signal?: AbortSignal }
  ) {
    return http.get("/products", { params, signal: options?.signal });
  },

  getById(id: number | string) {
    return http.get(`/products/${id}`);
  },

  create(body: ProductPayload) {
    return http.post("/products", body);
  },

  update(id: number | string, body: ProductPayload) {
    return http.put(`/products/${id}`, body);
  },
};

export default productApi;
