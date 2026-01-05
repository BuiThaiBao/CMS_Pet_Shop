import http from "./http";

export type BookingTimeUpdate = {
  oldTime: string; // Format: "08:00"
  newTime: string | null; // Format: "08:30" or null to delete
  maxCapacity: number | null; // New capacity or null to keep unchanged
};

export type BookingTimePayload = {
  serviceId: number;
  time: string; // Format: "15:30"
  isDeleted: "0" | "1"; // "0" = active, "1" = deleted/inactive
};

export type AddTimeSlotPayload = {
  serviceId: number;
  startTime: string; // Format: "14:00"
  maxCapacity: number;
};

export type ServicePayload = {
  name: string;
  title?: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  isActive?: "0" | "1";
  bookingTimeUpdates?: BookingTimeUpdate[];
};

// Response type for active services
export interface ServicePetResponse {
  id: number;
  name: string;
  title?: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  isActive?: string;
}

// Response type for available booking times
export interface BookingTimeResponse {
  id: number;
  slotDate: string; // Format: "2024-12-30"
  startTime: string; // Format: "09:00:00"
  endTime: string; // Format: "10:00:00"
  maxCapacity: number;
  bookedCount: number;
  availableCount: number;
}

// Request type for available booking times
export interface AvailableBookingTimeRequest {
  serviceId: number;
  date: string; // Format: "2024-12-30"
}

// Generic API response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  result: T;
}

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

  /**
   * Get active booking times for a service
   */
  getActiveBookingTimes: (serviceId: number | string) => {
    return http.post("/booking-times/active", { serviceId });
  },

  /**
   * Update booking time active status
   */
  updateBookingTimeActive: (payload: BookingTimePayload) => {
    return http.post("/booking-times/active", payload);
  },

  /**
   * Add new time slot to a service
   */
  addTimeSlot: (payload: AddTimeSlotPayload) => {
    return http.post("/booking-times/add-time", payload);
  },

  /**
   * Check if service title exists
   */
  checkTitle: (title: string) => {
    return http.post("/services/check-title", { title });
  },

  /**
   * Get all active services
   */
  getActiveServices: () => {
    return http.get<ApiResponse<ServicePetResponse[]>>("/services/active");
  },

  /**
   * Get available booking times for a service on a specific date
   */
  getAvailableBookingTimes: (request: AvailableBookingTimeRequest) => {
    return http.post<ApiResponse<BookingTimeResponse[]>>("/booking-times/available", request);
  },
};

export default serviceApi;
