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

export type CreateProductAllInOnePayload = {
  name: string;
  categoryId: number;
  shortDescription: string;
  description: string;
  animal: string;
  brand: string;
  featured: boolean;
  images: Array<{
    imageUrl: string;
    publicId: string;
    position: number;
    primary: boolean;
  }>;
  variants: Array<{
    variantName: string;
    price: number;
    weight: number;
    stockQuantity: number;
    associatedImageUrls: string[];
  }>;
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
    return http.get("/products/admin", { params, signal: options?.signal });
  },

  getById(id: number | string) {
    return http.get(`/products/admin/${id}`);
  },

  create(body: ProductPayload) {
    return http.post("/products", body);
  },

  update(id: number | string, body: ProductPayload) {
    return http.put(`/products/${id}`, body);
  },

  createAll(body: CreateProductAllInOnePayload) {
    return http.post("/products/create-all", body);
  },
  checkProductExists(name: string) {
    return http.post("/products/check-exists", {
      name: name.trim(),
    });
  },
};

export default productApi;
