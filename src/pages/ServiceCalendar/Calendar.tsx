import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg } from "@fullcalendar/core";
import { useModal } from "../../hooks/useModal";
import PageMeta from "../../components/common/PageMeta";
import appointmentApi, { AppointmentResponse, AppointmentStatus } from "../../services/api/appointmentApi";
import AppointmentDetailModal from "./AppointmentDetailModal";
import CreateAppointmentModal from "./CreateAppointmentModal";
import calendarStyles from "./calendarStyles";

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    extendedProps: {
        calendar: string;
        appointment: AppointmentResponse;
    };
}

// Status color mapping
const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
        case "SCHEDULED":
            return "Primary";
        case "COMPLETED":
            return "Success";
        case "CANCELED":
            return "Danger";
        default:
            return "Primary";
    }
};

const Calendar: React.FC = () => {
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponse | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const calendarRef = useRef<FullCalendar>(null);
    const { isOpen, openModal, closeModal } = useModal();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Fetch appointments from API
    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await appointmentApi.list();

            if (response.data.success && response.data.result) {
                const calendarEvents: CalendarEvent[] = response.data.result.map((appointment) => {
                    // Snap start time to the beginning of the hour (e.g., 10:30 -> 10:00)
                    const originalStart = new Date(appointment.appointmentStart.replace(" ", "T"));
                    const snappedStart = new Date(originalStart);
                    snappedStart.setMinutes(0, 0, 0); // Snap to start of hour

                    // Set end time to 59 minutes after start (fills the hour slot)
                    const endDate = new Date(snappedStart.getTime() + 59 * 60000);

                    return {
                        id: appointment.id.toString(),
                        title: appointment.serviceName,
                        start: snappedStart.toISOString(),
                        end: endDate.toISOString(),
                        extendedProps: {
                            calendar: getStatusColor(appointment.status),
                            appointment: appointment,
                        },
                    };
                });
                setEvents(calendarEvents);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleEventClick = (clickInfo: EventClickArg) => {
        const appointment = clickInfo.event.extendedProps.appointment as AppointmentResponse;
        setSelectedAppointment(appointment);
        openModal();
    };

    const handleCloseModal = () => {
        closeModal();
        setSelectedAppointment(null);
    };

    // Handle appointment update - refresh the calendar
    const handleUpdate = () => {
        fetchAppointments();
    };

    // Handle create modal
    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    const handleCreate = () => {
        fetchAppointments();
    };

    // Custom event render function
    const renderEventContent = (eventInfo: any) => {
        const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
        const appointment = eventInfo.event.extendedProps.appointment;

        // Extract time from appointmentStart and appointmentEnd (format: "2024-12-30 09:00:00" -> "09:00")
        const startTime = appointment?.appointmentStart?.split(" ")[1]?.slice(0, 5) || "";
        const endTime = appointment?.appointmentEnd?.split(" ")[1]?.slice(0, 5) || "";

        return (
            <div className={`event-fc-color flex flex-col ${colorClass} rounded-sm event-content w-full`}>
                <div className="event-time" style={{ fontSize: '10px', fontWeight: 600, marginBottom: '2px' }}>
                    {startTime} - {endTime}
                </div>
                <div className="event-service-name">
                    {appointment?.serviceName || eventInfo.event.title}
                </div>
                <div className="event-email">
                    {appointment?.email || ""}
                </div>
            </div>
        );
    };

    return (
        <>
            <PageMeta
                title="Lịch hẹn | CMS Pet Shop"
                description="Quản lý lịch hẹn dịch vụ thú cưng"
            />
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-gray-500 dark:text-gray-400">Đang tải lịch hẹn...</div>
                    </div>
                ) : (
                    <div className="custom-calendar">
                        <style>{calendarStyles}</style>
                        {/* Status Legend */}
                        <div className="flex items-center justify-between gap-4 mb-4 px-4 mt-3">
                            <button
                                onClick={handleOpenCreateModal}
                                type="button"
                                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Thêm lịch hẹn
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.95)' }}></div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Đã xác nhận</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.95)' }}></div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Hoàn thành</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.95)' }}></div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Đã hủy</span>
                                </div>
                            </div>
                        </div>
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: "prev,next today",
                                center: "title",
                                right: "dayGridMonth,listWeek,listDay",
                            }}
                            events={events}
                            selectable={false}
                            eventClick={handleEventClick}
                            eventContent={renderEventContent}
                            height={600}
                            dayMaxEvents={false}
                            locale="vi"
                            buttonText={{
                                today: "Hôm nay",
                                month: "Tháng",
                                week: "Tuần",
                                day: "Ngày",
                                listWeek: "Tuần",
                                listDay: "Ngày",
                            }}
                            allDaySlot={false}
                        />
                    </div>
                )}

                {/* Detail Modal */}
                <AppointmentDetailModal
                    isOpen={isOpen}
                    onClose={handleCloseModal}
                    appointment={selectedAppointment}
                    onUpdate={handleUpdate}
                />

                {/* Create Modal */}
                <CreateAppointmentModal
                    isOpen={isCreateModalOpen}
                    onClose={handleCloseCreateModal}
                    onCreate={handleCreate}
                />
            </div>
        </>
    );
};

export default Calendar;

