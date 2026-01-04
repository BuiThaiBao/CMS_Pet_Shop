import React, { useState, useEffect, useRef } from "react";
import { Modal } from "../../components/ui/modal";
import { AppointmentResponse, AppointmentStatus } from "../../services/api/appointmentApi";
import appointmentApi, { UpdateServiceAppointmentRequest } from "../../services/api/appointmentApi";
import serviceApi, { ServicePetResponse, BookingTimeResponse } from "../../services/api/serviceApi";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { Vietnamese } from "flatpickr/dist/l10n/vn.js";

interface AppointmentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: AppointmentResponse | null;
    onUpdate?: () => void;
}

// Status label mapping
const getStatusLabel = (status: AppointmentStatus): string => {
    switch (status) {
        case "SCHEDULED":
            return "Đã xác nhận";
        case "COMPLETED":
            return "Hoàn thành";
        case "CANCELED":
            return "Đã hủy";
        default:
            return status;
    }
};

// Status color classes
const getStatusColorClass = (status: AppointmentStatus): string => {
    switch (status) {
        case "SCHEDULED":
            return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
        case "COMPLETED":
            return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
        case "CANCELED":
            return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
        default:
            return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
};

// Status options for dropdown
const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
    { value: "SCHEDULED", label: "Đã xác nhận" },
    { value: "COMPLETED", label: "Hoàn thành" },
    { value: "CANCELED", label: "Đã hủy" },
];

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
    isOpen,
    onClose,
    appointment,
    onUpdate,
}) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Services and booking times data
    const [services, setServices] = useState<ServicePetResponse[]>([]);
    const [bookingTimes, setBookingTimes] = useState<BookingTimeResponse[]>([]);

    // Edit form data
    const [selectedServiceId, setSelectedServiceId] = useState<number>(0);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedBookingTimeId, setSelectedBookingTimeId] = useState<number>(0);
    const [namePet, setNamePet] = useState<string>("");
    const [speciePet, setSpeciePet] = useState<string>("");
    const [status, setStatus] = useState<AppointmentStatus>("SCHEDULED");
    const [notes, setNotes] = useState<string>("");

    // Date picker ref
    const datePickerRef = useRef<HTMLInputElement>(null);
    const flatpickrInstance = useRef<flatpickr.Instance | null>(null);

    // Check if the original appointment is in the past
    const isAppointmentPast = (() => {
        if (!appointment) return false;
        // appointmentStart format: "2024-12-30 09:00:00"
        const appointmentDateTime = new Date(appointment.appointmentStart.replace(" ", "T"));
        const now = new Date();
        console.log("Appointment time:", appointmentDateTime, "Now:", now, "isPast:", appointmentDateTime <= now);
        return appointmentDateTime <= now;
    })();

    // Reset form when appointment changes or modal closes
    useEffect(() => {
        if (appointment && isOpen) {
            setSelectedServiceId(appointment.serviceId);
            setSelectedDate(appointment.slotDate);
            setSelectedBookingTimeId(appointment.bookingTimeId);
            setNamePet(appointment.namePet);
            setSpeciePet(appointment.speciePet);
            setStatus(appointment.status);
            setNotes(appointment.notes || "");
            setIsEditMode(false);
        }
    }, [appointment, isOpen]);

    // Fetch active services when entering edit mode
    useEffect(() => {
        if (isEditMode && services.length === 0) {
            fetchActiveServices();
        }
    }, [isEditMode]);

    // Fetch booking times when service or date changes in edit mode
    useEffect(() => {
        if (isEditMode && selectedServiceId && selectedDate) {
            fetchAvailableBookingTimes();
        }
    }, [isEditMode, selectedServiceId, selectedDate]);

    // Initialize flatpickr date picker
    useEffect(() => {
        if (isEditMode && datePickerRef.current) {
            // Destroy existing instance if any
            if (flatpickrInstance.current) {
                flatpickrInstance.current.destroy();
                flatpickrInstance.current = null;
            }

            // Allow selecting the appointment's original date even if it's today or earlier
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const appointmentDate = appointment?.slotDate ? new Date(appointment.slotDate) : today;
            const minDateValue = appointmentDate < today ? appointmentDate : today;
            const initialDate = selectedDate || appointment?.slotDate;

            flatpickrInstance.current = flatpickr(datePickerRef.current, {
                locale: Vietnamese,
                dateFormat: "Y-m-d",
                minDate: minDateValue,
                maxDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from today
                defaultDate: initialDate || undefined,
                onChange: (_selectedDates, dateStr) => {
                    handleDateChange(dateStr);
                },
            });

            // Immediately set the date to ensure it's displayed
            if (initialDate) {
                flatpickrInstance.current.setDate(initialDate, false);
            }
        }

        // Cleanup when exiting edit mode
        return () => {
            if (flatpickrInstance.current && !isEditMode) {
                flatpickrInstance.current.destroy();
                flatpickrInstance.current = null;
            }
        };
    }, [isEditMode]);

    const fetchActiveServices = async () => {
        try {
            setLoading(true);
            const response = await serviceApi.getActiveServices();
            if (response.data.success && response.data.result) {
                setServices(response.data.result);
            }
        } catch (error) {
            console.error("Error fetching services:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableBookingTimes = async () => {
        try {
            setLoading(true);
            const response = await serviceApi.getAvailableBookingTimes({
                serviceId: selectedServiceId,
                date: selectedDate,
            });
            if (response.data.success && response.data.result) {
                const available = response.data.result;

                // Include current booking time in the list if same date and service
                if (appointment &&
                    selectedDate === appointment.slotDate &&
                    selectedServiceId === appointment.serviceId &&
                    !available.find((bt) => bt.id === appointment.bookingTimeId)
                ) {
                    // Add current booking time slot as available (it's the user's own slot)
                    available.unshift({
                        id: appointment.bookingTimeId,
                        slotDate: appointment.slotDate,
                        startTime: appointment.startTime,
                        endTime: appointment.endTime,
                        maxCapacity: 1,
                        bookedCount: 0,
                        availableCount: 1, // Mark as available since it's user's own slot
                    });
                }

                setBookingTimes(available);
            }
        } catch (error) {
            console.error("Error fetching booking times:", error);
            setBookingTimes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleServiceChange = (serviceId: number) => {
        setSelectedServiceId(serviceId);
        setSelectedBookingTimeId(0); // Reset booking time when service changes
        setBookingTimes([]); // Clear booking times
    };

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        setSelectedBookingTimeId(0); // Reset booking time when date changes
        setBookingTimes([]); // Clear booking times
    };

    const handleEdit = () => {
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        // Reset form to original values
        if (appointment) {
            setSelectedServiceId(appointment.serviceId);
            setSelectedDate(appointment.slotDate);
            setSelectedBookingTimeId(appointment.bookingTimeId);
            setNamePet(appointment.namePet);
            setSpeciePet(appointment.speciePet);
            setStatus(appointment.status);
            setNotes(appointment.notes || "");
        }
        setIsEditMode(false);
    };

    const handleSave = async () => {
        if (!appointment) return;

        try {
            setSaving(true);

            const request: UpdateServiceAppointmentRequest = {
                id: appointment.id,
                namePet,
                speciePet,
                status,
                notes: notes || undefined,
            };

            // Only include bookingTimeId if it changed
            if (selectedBookingTimeId !== appointment.bookingTimeId) {
                request.bookingTimeId = selectedBookingTimeId;
            }

            const response = await appointmentApi.update(request);

            if (response.data.success) {
                setIsEditMode(false);
                onUpdate?.();
                onClose();
            } else {
                alert("Cập nhật thất bại: " + response.data.message);
            }
        } catch (error: any) {
            console.error("Error updating appointment:", error);
            alert("Cập nhật thất bại: " + (error.response?.data?.message || "Lỗi không xác định"));
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setIsEditMode(false);
        onClose();
    };

    if (!appointment) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            className="max-w-[900px] p-6 lg:p-8"
        >
            <div className="flex flex-col overflow-y-auto custom-scrollbar">
                <div className="mt-6 mb-6 flex items-center justify-between">
                    <div>
                        <h5 className="mb-2 font-semibold text-gray-800 text-xl dark:text-white/90 lg:text-2xl">
                            Chi tiết lịch hẹn
                        </h5>
                        {!isEditMode && (
                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClass(appointment.status)}`}>
                                {getStatusLabel(appointment.status)}
                            </div>
                        )}
                    </div>
                    {!isEditMode && (
                        <button
                            onClick={handleEdit}
                            type="button"
                            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Chỉnh sửa
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Status + Email Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Status */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Trạng thái
                            </label>
                            {isEditMode ? (
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium w-fit ${getStatusColorClass(appointment.status)}`}>
                                    {getStatusLabel(appointment.status)}
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Email khách hàng
                            </span>
                            <span className="text-base text-gray-800 dark:text-white/90 truncate" title={appointment.email}>
                                {appointment.email}
                            </span>
                        </div>
                    </div>

                    {/* Service Name */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Dịch vụ
                        </label>
                        {isEditMode ? (
                            isAppointmentPast ? (
                                <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                    {appointment.serviceName} <span className="text-xs text-red-500">(Lịch hẹn đã qua - không thể thay đổi)</span>
                                </div>
                            ) : (
                                <select
                                    value={selectedServiceId}
                                    onChange={(e) => handleServiceChange(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    disabled={loading}
                                >
                                    <option value={0}>Chọn dịch vụ</option>
                                    {services.map((service) => (
                                        <option key={service.id} value={service.id}>
                                            {service.title || service.name}
                                        </option>
                                    ))}
                                </select>
                            )
                        ) : (
                            <span className="text-base text-gray-800 dark:text-white/90">
                                {appointment.serviceName}
                            </span>
                        )}
                    </div>

                    {/* Date (Edit Mode) */}
                    {isEditMode && (
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Ngày hẹn
                            </label>
                            {isAppointmentPast ? (
                                <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                    {selectedDate} <span className="text-xs text-red-500">(Lịch hẹn đã qua - không thể thay đổi)</span>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        ref={datePickerRef}
                                        type="text"
                                        readOnly
                                        placeholder="Chọn ngày"
                                        value={selectedDate}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white cursor-pointer"
                                    />
                                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Booking Time (Edit Mode) */}
                    {isEditMode && (
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Khung giờ hẹn
                            </label>
                            {isAppointmentPast ? (
                                <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                    {appointment.startTime} - {appointment.endTime} <span className="text-xs text-red-500">(Không thể thay đổi)</span>
                                </div>
                            ) : !selectedDate ? (
                                <p className="text-sm text-gray-400 dark:text-gray-500">Vui lòng chọn ngày hẹn trước</p>
                            ) : loading ? (
                                <p className="text-sm text-gray-400 dark:text-gray-500">Đang tải khung giờ...</p>
                            ) : bookingTimes.length === 0 ? (
                                <p className="text-sm text-gray-400 dark:text-gray-500">Không có khung giờ khả dụng cho ngày này</p>
                            ) : (
                                <div className="space-y-4">
                                    {/* Morning slots */}
                                    {(() => {
                                        const morningSlots = bookingTimes
                                            .filter((slot) => slot.startTime < "12:00")
                                            .sort((a, b) => a.startTime.localeCompare(b.startTime));
                                        if (morningSlots.length === 0) return null;
                                        return (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Buổi sáng</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {morningSlots.map((slot) => {
                                                        const isSelected = selectedBookingTimeId === slot.id;
                                                        // Check if slot is in the past
                                                        const slotDateTime = new Date(`${selectedDate}T${slot.startTime}`);
                                                        const now = new Date();
                                                        const isPast = slotDateTime <= now;
                                                        const isDisabled = slot.availableCount === 0 || isPast;
                                                        return (
                                                            <button
                                                                key={slot.id}
                                                                type="button"
                                                                onClick={() => !isDisabled && setSelectedBookingTimeId(slot.id)}
                                                                disabled={isDisabled}
                                                                className={`px-3 py-2 rounded-lg text-sm transition-colors ${isSelected
                                                                    ? "bg-blue-500 text-white"
                                                                    : isDisabled
                                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                                                        : "bg-white border border-orange-400 text-orange-500 hover:bg-orange-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                                                                    }`}
                                                            >
                                                                <span className="block">{slot.startTime} - {slot.endTime}</span>
                                                                <span className="block text-xs">{isPast ? "Đã qua" : `trống ${slot.availableCount} chỗ`}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Afternoon slots */}
                                    {(() => {
                                        const afternoonSlots = bookingTimes
                                            .filter((slot) => slot.startTime >= "12:00")
                                            .sort((a, b) => a.startTime.localeCompare(b.startTime));
                                        if (afternoonSlots.length === 0) return null;
                                        return (
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Buổi chiều</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {afternoonSlots.map((slot) => {
                                                        const isSelected = selectedBookingTimeId === slot.id;
                                                        // Check if slot is in the past
                                                        const slotDateTime = new Date(`${selectedDate}T${slot.startTime}`);
                                                        const now = new Date();
                                                        const isPast = slotDateTime <= now;
                                                        const isDisabled = slot.availableCount === 0 || isPast;
                                                        return (
                                                            <button
                                                                key={slot.id}
                                                                type="button"
                                                                onClick={() => !isDisabled && setSelectedBookingTimeId(slot.id)}
                                                                disabled={isDisabled}
                                                                className={`px-3 py-2 rounded-lg text-sm transition-colors ${isSelected
                                                                    ? "bg-blue-500 text-white"
                                                                    : isDisabled
                                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                                                        : "bg-white border border-orange-400 text-orange-500 hover:bg-orange-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                                                                    }`}
                                                            >
                                                                <span className="block">{slot.startTime} - {slot.endTime}</span>
                                                                <span className="block text-xs">{isPast ? "Đã qua" : `trống ${slot.availableCount} chỗ`}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pet Name + Species Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Pet Name */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Tên thú cưng
                            </label>
                            {isEditMode ? (
                                <input
                                    type="text"
                                    value={namePet}
                                    onChange={(e) => setNamePet(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    placeholder="Nhập tên thú cưng"
                                />
                            ) : (
                                <span className="text-base text-gray-800 dark:text-white/90">
                                    {appointment.namePet}
                                </span>
                            )}
                        </div>

                        {/* Pet Species */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Loài
                            </label>
                            {isEditMode ? (
                                <input
                                    type="text"
                                    value={speciePet}
                                    onChange={(e) => setSpeciePet(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                    placeholder="Nhập loài thú cưng"
                                />
                            ) : (
                                <span className="text-base text-gray-800 dark:text-white/90">
                                    {appointment.speciePet}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Time (View Mode Only) */}
                    {!isEditMode && (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Thời gian
                            </span>
                            <span className="text-base text-gray-800 dark:text-white/90">
                                {appointment.appointmentStart} - {appointment.appointmentEnd.split(" ")[1]}
                            </span>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Ghi chú
                        </label>
                        {isEditMode ? (
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none"
                                rows={3}
                                placeholder="Nhập ghi chú"
                            />
                        ) : (
                            <span className="text-base text-gray-800 dark:text-white/90">
                                {appointment.notes || "Không có ghi chú"}
                            </span>
                        )}
                    </div>

                    {/* Created Date (View Mode Only) */}
                    {!isEditMode && (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Ngày tạo
                            </span>
                            <span className="text-base text-gray-800 dark:text-white/90">
                                {appointment.createdDate}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 mt-8 justify-end">
                    {isEditMode ? (
                        <>
                            <button
                                onClick={handleCancelEdit}
                                type="button"
                                disabled={saving}
                                className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                type="button"
                                disabled={saving || !namePet || !speciePet}
                                className="flex justify-center items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving && (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                )}
                                Lưu
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleClose}
                            type="button"
                            className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                        >
                            Đóng
                        </button>
                    )}
                </div>
            </div>
        </Modal >
    );
};

export default AppointmentDetailModal;
