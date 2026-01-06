import http from "./http";

// Appointment status enum - only 3 values from backend
export type AppointmentStatus =
    | "SCHEDULED"
    | "COMPLETED"
    | "CANCELED";

// Response type from API
export interface AppointmentResponse {
    id: number;
    serviceId: number;
    serviceName: string;
    bookingTimeId: number;
    slotDate: string; // Format: "2024-12-30"
    startTime: string; // Format: "09:00:00"
    endTime: string; // Format: "10:00:00"
    userId: number;
    email: string; // User email
    namePet: string;
    speciePet: string;
    appointmentStart: string; // Format: "2024-12-30 09:00:00"
    appointmentEnd: string; // Format: "2024-12-30 10:00:00"
    status: AppointmentStatus;
    notes: string | null;
    createdDate: string;
    updatedDate: string;
}

// Request type for fetching appointments
export interface AppointmentListRequest {
    userId: number;
    roleName: string;
}

// API response wrapper
export interface AppointmentListResponse {
    success: boolean;
    message: string;
    result: AppointmentResponse[];
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
}

// Request type for updating appointment
export interface UpdateServiceAppointmentRequest {
    id: number;
    bookingTimeId?: number;
    namePet: string;
    speciePet: string;
    status?: AppointmentStatus;
    notes?: string;
}

// Generic API response
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    result: T;
}

// Request type for filtering appointments
export interface FilterAppointmentRequest {
    status?: string;      // SCHEDULED, COMPLETED, CANCELED
    email?: string;       // Search by email
    serviceId?: number;   // Filter by service
    fromDate?: string;    // Format: yyyy-MM-dd
    toDate?: string;      // Format: yyyy-MM-dd
}

// Response type for appointment statistics
export interface AppointmentStatisticsResponse {
    todayCount: number;
    scheduledCount: number;
    completedCount: number;
    totalCount: number;
}

// Statistics API response wrapper
export interface StatisticsApiResponse {
    success: boolean;
    message: string;
    result: AppointmentStatisticsResponse;
}

const appointmentApi = {
    /**
     * Get all appointments (for SHOP role)
     * @param page Page number (0-indexed)
     * @param size Number of items per page
     */
    list: (page: number = 0, size: number = 1000) => {
        const request: AppointmentListRequest = {
            userId: 1, // Admin/Shop user ID
            roleName: "SHOP", // SHOP role gets all appointments
        };
        return http.post<AppointmentListResponse>(
            `/appointments/list?page=${page}&size=${size}`,
            request
        );
    },

    /**
     * Get appointments for a specific user
     * @param userId User ID
     * @param page Page number
     * @param size Items per page
     */
    listByUser: (userId: number, page: number = 0, size: number = 100) => {
        const request: AppointmentListRequest = {
            userId,
            roleName: "USER",
        };
        return http.post<AppointmentListResponse>(
            `/appointments/list?page=${page}&size=${size}`,
            request
        );
    },

    /**
     * Update an appointment
     * @param request Update request payload
     */
    update: (request: UpdateServiceAppointmentRequest) => {
        return http.put<ApiResponse<AppointmentResponse>>(
            `/appointments/update`,
            request
        );
    },

    /**
     * Create an appointment by admin (SHOP role)
     * @param request Create request payload
     */
    createByAdmin: (request: AdminCreateAppointmentRequest) => {
        return http.post<ApiResponse<AppointmentResponse>>(
            `/appointments/admin-email`,
            request
        );
    },

    /**
     * Filter appointments with pagination
     * @param params Filter parameters
     * @param page Page number (0-indexed)
     * @param size Number of items per page
     */
    filter: (params: FilterAppointmentRequest, page: number = 0, size: number = 10) => {
        const queryParams = new URLSearchParams();
        queryParams.append("page", page.toString());
        queryParams.append("size", size.toString());

        if (params.status) queryParams.append("status", params.status);
        if (params.email) queryParams.append("email", params.email);
        if (params.serviceId) queryParams.append("serviceId", params.serviceId.toString());
        if (params.fromDate) queryParams.append("fromDate", params.fromDate);
        if (params.toDate) queryParams.append("toDate", params.toDate);

        return http.get<AppointmentListResponse>(
            `/appointments/filter?${queryParams.toString()}`
        );
    },

    /**
     * Get appointment statistics
     */
    getStatistics: () => {
        return http.get<StatisticsApiResponse>(`/appointments/statistics`);
    },
};

// Request type for admin creating appointment
export interface AdminCreateAppointmentRequest {
    bookingTimeId: number;
    email: string;
    namePet: string;
    speciePet: string;
    notes?: string;
}

export default appointmentApi;
