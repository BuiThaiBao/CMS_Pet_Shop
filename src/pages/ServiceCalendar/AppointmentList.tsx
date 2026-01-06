import React, { useState, useEffect, useCallback, useRef } from "react";
import appointmentApi, {
    AppointmentResponse,
    AppointmentStatisticsResponse,
    FilterAppointmentRequest,
} from "../../services/api/appointmentApi";
import serviceApi, { ServicePetResponse } from "../../services/api/serviceApi";
import AppointmentDetailModal from "./AppointmentDetailModal";
import flatpickr from "flatpickr";
import { Vietnamese } from "flatpickr/dist/l10n/vn.js";
import "flatpickr/dist/flatpickr.min.css";

// Status mapping: English value -> Vietnamese label
const STATUS_OPTIONS = [
    { value: "", label: "Tất cả" },
    { value: "SCHEDULED", label: "Đặt lịch" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "CANCELED", label: "Đã hủy" },
];

const getStatusLabel = (status: string): string => {
    switch (status) {
        case "SCHEDULED":
            return "Đặt lịch";
        case "COMPLETED":
            return "Hoàn thành";
        case "CANCELED":
            return "Đã hủy";
        default:
            return status;
    }
};

const getStatusColorClass = (status: string): string => {
    switch (status) {
        case "SCHEDULED":
            return "bg-blue-100 text-blue-800";
        case "COMPLETED":
            return "bg-green-100 text-green-800";
        case "CANCELED":
            return "bg-red-100 text-red-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
};

const AppointmentList: React.FC = () => {
    // Statistics state
    const [statistics, setStatistics] = useState<AppointmentStatisticsResponse | null>(null);

    // Filter state
    const [filters, setFilters] = useState<FilterAppointmentRequest>({
        status: "",
        email: "",
        serviceId: undefined,
        fromDate: "",
        toDate: "",
    });

    // Appointments state
    const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    // Services for dropdown
    const [services, setServices] = useState<ServicePetResponse[]>([]);

    // Modal state
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Date picker refs
    const fromDateRef = useRef<HTMLInputElement>(null);
    const toDateRef = useRef<HTMLInputElement>(null);
    const fromFlatpickrRef = useRef<flatpickr.Instance | null>(null);
    const toFlatpickrRef = useRef<flatpickr.Instance | null>(null);

    // Fetch statistics
    const fetchStatistics = useCallback(async () => {
        try {
            const response = await appointmentApi.getStatistics();
            if (response.data.success) {
                setStatistics(response.data.result);
            }
        } catch (err) {
            console.error("Error fetching statistics:", err);
        }
    }, []);

    // Fetch appointments with filters
    const fetchAppointments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await appointmentApi.filter(filters, currentPage, pageSize);
            if (response.data.success) {
                setAppointments(response.data.result);
                setTotalPages(response.data.totalPages);
                setTotalElements(response.data.totalElements);
            }
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setError("Không thể tải danh sách lịch hẹn");
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage]);

    // Fetch services for dropdown
    const fetchServices = useCallback(async () => {
        try {
            const response = await serviceApi.getActiveServices();
            if (response.data.success && response.data.result) {
                setServices(response.data.result);
            }
        } catch (err) {
            console.error("Error fetching services:", err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchStatistics();
        fetchServices();
    }, [fetchStatistics, fetchServices]);

    // Load appointments when filters or page changes
    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Initialize flatpickr date pickers
    useEffect(() => {
        // Initialize fromDate picker
        if (fromDateRef.current) {
            if (fromFlatpickrRef.current) {
                fromFlatpickrRef.current.destroy();
            }
            fromFlatpickrRef.current = flatpickr(fromDateRef.current, {
                locale: Vietnamese,
                dateFormat: "Y-m-d",
                onChange: (_selectedDates, dateStr) => {
                    setFilters(prev => ({ ...prev, fromDate: dateStr }));
                    setCurrentPage(0);
                },
            });
        }

        // Initialize toDate picker
        if (toDateRef.current) {
            if (toFlatpickrRef.current) {
                toFlatpickrRef.current.destroy();
            }
            toFlatpickrRef.current = flatpickr(toDateRef.current, {
                locale: Vietnamese,
                dateFormat: "Y-m-d",
                onChange: (_selectedDates, dateStr) => {
                    setFilters(prev => ({ ...prev, toDate: dateStr }));
                    setCurrentPage(0);
                },
            });
        }

        return () => {
            if (fromFlatpickrRef.current) {
                fromFlatpickrRef.current.destroy();
                fromFlatpickrRef.current = null;
            }
            if (toFlatpickrRef.current) {
                toFlatpickrRef.current.destroy();
                toFlatpickrRef.current = null;
            }
        };
    }, []);

    // Handle filter changes
    const handleFilterChange = (key: keyof FilterAppointmentRequest, value: string | number | undefined) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(0); // Reset to first page when filters change
    };

    // Clear all filters
    const handleClearFilters = () => {
        setFilters({
            status: "",
            email: "",
            serviceId: undefined,
            fromDate: "",
            toDate: "",
        });
        setCurrentPage(0);
        // Clear flatpickr values
        if (fromFlatpickrRef.current) {
            fromFlatpickrRef.current.clear();
        }
        if (toFlatpickrRef.current) {
            toFlatpickrRef.current.clear();
        }
    };

    // Handle appointment click
    const handleAppointmentClick = (appointment: AppointmentResponse) => {
        setSelectedAppointment(appointment);
        setIsModalOpen(true);
    };

    // Handle modal close
    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedAppointment(null);
    };

    // Handle appointment update (refresh list)
    const handleAppointmentUpdate = () => {
        fetchAppointments();
        fetchStatistics();
    };

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr.replace(" ", "T"));
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr.replace(" ", "T"));
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="p-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Today's Appointments */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Hôm nay</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{statistics?.todayCount || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Scheduled */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Đặt lịch</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{statistics?.scheduledCount || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Completed */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Hoàn thành</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{statistics?.completedCount || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Total */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng lịch hẹn</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{statistics?.totalCount || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    {/* Email search */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Tìm kiếm
                        </label>
                        <input
                            type="text"
                            value={filters.email || ""}
                            onChange={(e) => handleFilterChange("email", e.target.value)}
                            placeholder="Email khách hàng..."
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Status dropdown */}
                    <div className="w-40">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Trạng thái
                        </label>
                        <select
                            value={filters.status || ""}
                            onChange={(e) => handleFilterChange("status", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Service dropdown */}
                    <div className="w-48">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Dịch vụ
                        </label>
                        <select
                            value={filters.serviceId || ""}
                            onChange={(e) => handleFilterChange("serviceId", e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Tất cả dịch vụ</option>
                            {services.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title || s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* From Date */}
                    <div className="w-44">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Từ ngày
                        </label>
                        <div className="relative">
                            <input
                                ref={fromDateRef}
                                type="text"
                                readOnly
                                placeholder="Chọn ngày"
                                value={filters.fromDate || ""}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white cursor-pointer"
                            />
                            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    {/* To Date */}
                    <div className="w-44">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Đến ngày
                        </label>
                        <div className="relative">
                            <input
                                ref={toDateRef}
                                type="text"
                                readOnly
                                placeholder="Chọn ngày"
                                value={filters.toDate || ""}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white cursor-pointer"
                            />
                            <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    {/* Clear filters button */}
                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {/* Appointments Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Danh sách lịch hẹn
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {totalElements}
                        </span>
                    </h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        <svg className="animate-spin h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang tải...
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Không có lịch hẹn nào
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Thời gian
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Khách hàng
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Dịch vụ
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Thú cưng
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {appointments.map((appt) => (
                                    <tr
                                        key={appt.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                        onClick={() => handleAppointmentClick(appt)}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {formatDate(appt.appointmentStart)}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatTime(appt.appointmentStart)} - {formatTime(appt.appointmentEnd)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {appt.email}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {appt.serviceName}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {appt.namePet}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {appt.speciePet}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColorClass(appt.status)}`}>
                                                {getStatusLabel(appt.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAppointmentClick(appt);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} của {totalElements} lịch hẹn
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                Trước
                            </button>
                            <span className="px-3 py-1 text-sm">
                                {currentPage + 1} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Appointment Detail Modal */}
            <AppointmentDetailModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                appointment={selectedAppointment}
                onUpdate={handleAppointmentUpdate}
            />
        </div>
    );
};

export default AppointmentList;
