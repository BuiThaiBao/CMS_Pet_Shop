import http from "./http";

export type ServicePayload = {
  name: string;
  title?: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  isActive?: "0" | "1";
};

const serviceApi = {
  /**
   * Get paginated list of services
   */
  list: (params?: any, config?: any) => {
    return http.get("/services", { params, ...config });
  },

  /**
   * Get service by ID
   */
  getById: (id: number | string) => {
    return http.get(`/services/${id}`);
  },

  /**
   * Create a new service
   */
  create: (payload: ServicePayload) => {
    return http.post("/services", payload);
  },

  /**
   * Update service by ID
   */
  update: (id: number | string, payload: Partial<ServicePayload>) => {
    return http.put(`/services/${id}`, payload);
  },

  /**
   * Delete service by ID
   */
  delete: (id: number | string) => {
    return http.delete(`/services/${id}`);
  },
};

export default serviceApi;
