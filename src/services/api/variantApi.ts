import http from "./http";

export type VariantPayload = {
  productId?: number;
  productImageId?: number;
  variantName: string;
  weight?: number | null;
  price: number;
  stockQuantity: number;
  soldQuantity?: number;
  isDeleted?: string;
};

const variantApi = {
  /**
   * Create a new variant
   */
  create: (payload: VariantPayload) => {
    return http.post("/variants", payload);
  },

  /**
   * Update a variant by ID
   */
  update: (id: number | string, payload: Partial<VariantPayload>) => {
    return http.put(`/variants/${id}`, payload);
  },

  /**
   * Get variant by ID
   */
  getById: (id: number | string) => {
    return http.get(`/variants/${id}`);
  },

  /**
   * Delete variant by ID
   */
  delete: (id: number | string) => {
    return http.delete(`/variants/${id}`);
  },

  /**
   * Get variants by product ID
   */
  getByProductId: (productId: number | string, params?: any) => {
    return http.get(`/variants/product/${productId}`, { params });
  },
};

export default variantApi;
