import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "../../components/ui/modal";
import serviceApi, { ServicePetResponse, BookingTimeResponse } from "../../services/api/serviceApi";
import appointmentApi, { AdminCreateAppointmentRequest } from "../../services/api/appointmentApi";
import userApi from "../../services/api/userApi";
import flatpickr from "flatpickr";
import { Vietnamese } from "flatpickr/dist/l10n/vn.js";
import "flatpickr/dist/flatpickr.min.css";

interface CreateAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: () => void;
}

const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
    isOpen,
    onClose,
    onCreate,
}) => {
    // Form state
    const [email, setEmail] = useState("");
    const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<number>(0);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedBookingTimeId, setSelectedBookingTimeId] = useState<number>(0);
    const [namePet, setNamePet] = useState("");
    const [speciePet, setSpeciePet] = useState("");
    const [notes, setNotes] = useState("");

    // Data state
    const [services, setServices] = useState<ServicePetResponse[]>([]);
    const [bookingTimes, setBookingTimes] = useState<BookingTimeResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const datePickerRef = useRef<HTMLInputElement>(null);
    const flatpickrInstance = useRef<flatpickr.Instance | null>(null);
    const emailSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const emailInputRef = useRef<HTMLInputElement>(null);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setEmail("");
            setEmailSuggestions([]);
            setEmailError(null);
            setShowSuggestions(false);
            setSelectedServiceId(0);
            setSelectedDate("");
            setSelectedBookingTimeId(0);
            setNamePet("");
            setSpeciePet("");
            setNotes("");
            setServices([]);
            setBookingTimes([]);
            setError(null);
            if (flatpickrInstance.current) {
                flatpickrInstance.current.destroy();
                flatpickrInstance.current = null;
            }
        }
    }, [isOpen]);

    // Fetch services when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchActiveServices();
        }
    }, [isOpen]);

    // Initialize flatpickr when modal opens
    useEffect(() => {
        if (isOpen && datePickerRef.current) {
            if (flatpickrInstance.current) {
                flatpickrInstance.current.destroy();
                flatpickrInstance.current = null;
            }

            flatpickrInstance.current = flatpickr(datePickerRef.current, {
                locale: Vietnamese,
                dateFormat: "Y-m-d",
                minDate: "today",
                maxDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                onChange: (_selectedDates, dateStr) => {
                    setSelectedDate(dateStr);
                    setSelectedBookingTimeId(0);
                },
            });
        }

        return () => {
            if (flatpickrInstance.current && !isOpen) {
                flatpickrInstance.current.destroy();
                flatpickrInstance.current = null;
            }
        };
    }, [isOpen]);

    // Fetch booking times when service or date changes
    useEffect(() => {
        if (selectedServiceId && selectedDate) {
            fetchAvailableBookingTimes();
        }
    }, [selectedServiceId, selectedDate]);

    const fetchActiveServices = async () => {
        try {
            setLoading(true);
            const response = await serviceApi.getActiveServices();
            if (response.data.success && response.data.result) {
                setServices(response.data.result);
            }
        } catch (error) {
            console.error("Error fetching services:", error);
            setError("Không thể tải danh sách dịch vụ");
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
                setBookingTimes(response.data.result);
            }
        } catch (error) {
            console.error("Error fetching booking times:", error);
            setBookingTimes([]);
        } finally {
            setLoading(false);
        }
    };

    // Email search with debounce
    const handleEmailChange = useCallback((value: string) => {
        setEmail(value);
        setError(null);
        setEmailError(null);

        // Clear previous timeout
        if (emailSearchTimeout.current) {
            clearTimeout(emailSearchTimeout.current);
        }

        if (value.length < 2) {
            setEmailSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        // Debounce 100ms for fast response
        emailSearchTimeout.current = setTimeout(async () => {
            try {
                const response = await userApi.searchEmail(value);
                if (response.data.success && response.data.result) {
                    const emails = response.data.result.emails;
                    setEmailSuggestions(emails);
                    if (emails.length > 0) {
                        setShowSuggestions(true);
                        setEmailError(null);
                    } else {
                        setShowSuggestions(false);
                        // Backend throw exception nên sẽ nhảy vào catch, 
                        // nhưng handle case này cho chắc chắn
                        setEmailError("Không tìm thấy email phù hợp");
                    }
                }
            } catch (error: any) {
                console.error("Error searching emails:", error);
                setEmailSuggestions([]);
                // Lấy message từ backend response
                const errorMessage = error.response?.data?.message || "Lỗi khi tìm kiếm email";
                setEmailError(errorMessage);
            }
        }, 100);
    }, []);

    const handleEmailSelect = (selectedEmail: string) => {
        setEmail(selectedEmail);
        setShowSuggestions(false);
        emailInputRef.current?.blur();
    };

    const handleServiceChange = (serviceId: number) => {
        setSelectedServiceId(serviceId);
        setSelectedBookingTimeId(0);
        setBookingTimes([]);
    };

    const handleSave = async () => {
        // Validation
        if (!email) {
            setError("Vui lòng nhập email khách hàng");
            return;
        }
        if (!selectedServiceId) {
            setError("Vui lòng chọn dịch vụ");
            return;
        }
        if (!selectedDate) {
            setError("Vui lòng chọn ngày hẹn");
            return;
        }
        if (!selectedBookingTimeId) {
            setError("Vui lòng chọn khung giờ");
            return;
        }
        if (!namePet) {
            setError("Vui lòng nhập tên thú cưng");
            return;
        }
        if (!speciePet) {
            setError("Vui lòng nhập loài thú cưng");
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const request: AdminCreateAppointmentRequest = {
                bookingTimeId: selectedBookingTimeId,
                email,
                namePet,
                speciePet,
                notes: notes || undefined,
            };

            const response = await appointmentApi.createByAdmin(request);
            if (response.data.success) {
                onCreate();
                onClose();
            } else {
                setError(response.data.message || "Tạo lịch hẹn thất bại");
            }
        } catch (error: unknown) {
            console.error("Error creating appointment:", error);
            const err = error as { response?: { data?: { message?: string } } };
            setError(err.response?.data?.message || "Có lỗi xảy ra khi tạo lịch hẹn");
        } finally {
            setSaving(false);
        }
    };

    // Check if slot is in the past
    const isSlotPast = (slotStartTime: string) => {
        const slotDateTime = new Date(`${selectedDate}T${slotStartTime}`);
        return slotDateTime <= new Date();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-[900px] p-6 lg:p-8"
        >
            <div className="flex flex-col overflow-y-auto custom-scrollbar">
                <div className="mt-6 mb-6">
                    <h5 className="font-semibold text-gray-800 text-xl dark:text-white/90 lg:text-2xl">
                        Tạo lịch hẹn mới
                    </h5>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Email Input with Autocomplete */}
                    <div className="flex flex-col relative">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Email khách hàng
                        </label>
                        <input
                            ref={emailInputRef}
                            type="email"
                            value={email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            onFocus={() => emailSuggestions.length > 0 && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            placeholder="Nhập email khách hàng"
                        />
                        {emailError && (
                            <span className="text-xs text-red-500 mt-1">{emailError}</span>
                        )}
                        {showSuggestions && emailSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto dark:bg-gray-800 dark:border-gray-600">
                                {emailSuggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white"
                                        onMouseDown={() => handleEmailSelect(suggestion)}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Service Dropdown */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Dịch vụ
                        </label>
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
                    </div>

                    {/* Date Picker */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Ngày hẹn
                        </label>
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
                    </div>

                    {/* Booking Time Slots */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Khung giờ hẹn
                        </label>
                        {!selectedDate ? (
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
                                                    const isPast = isSlotPast(slot.startTime);
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
                                                    const isPast = isSlotPast(slot.startTime);
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

                    {/* Pet Name + Species Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Tên thú cưng
                            </label>
                            <input
                                type="text"
                                value={namePet}
                                onChange={(e) => setNamePet(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                placeholder="Nhập tên thú cưng"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Loài
                            </label>
                            <input
                                type="text"
                                value={speciePet}
                                onChange={(e) => setSpeciePet(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                placeholder="Nhập loài thú cưng"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Ghi chú
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none"
                            rows={3}
                            placeholder="Ghi chú thêm (tùy chọn)"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        type="button"
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? "Đang tạo..." : "Tạo lịch hẹn"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateAppointmentModal;
