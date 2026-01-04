// Calendar custom styles
export const calendarStyles = `
  /* Custom styles for calendar events - Month View */
  .fc-daygrid-day-events {
    max-height: 150px;
    overflow-y: auto;
    scrollbar-width: thin;
    padding: 2px;
  }
  .fc-daygrid-day-events::-webkit-scrollbar {
    width: 4px;
  }
  .fc-daygrid-day-events::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 2px;
  }
  .fc-daygrid-day-events::-webkit-scrollbar-track {
    background-color: rgba(156, 163, 175, 0.1);
  }

  /* List View styles */
  .fc-list {
    border: none !important;
  }
  .fc-list-event {
    cursor: pointer;
  }
  .fc-list-event:hover td {
    background-color: rgba(59, 130, 246, 0.1) !important;
  }
  .fc-list-event-time {
    min-width: 100px;
    font-size: 13px;
  }
  .fc-list-event-title {
    font-size: 14px;
  }
  .fc-list-day-cushion {
    background-color: rgba(229, 231, 235, 0.5) !important;
    font-weight: 600;
  }
  .fc-list-event-dot {
    border-color: currentColor !important;
  }

  /* General event styles */
  .fc-event {
    cursor: pointer;
    border: none !important;
  }
  .fc-daygrid-event {
    min-height: 50px;
    margin: 1px 0 !important;
    border-radius: 4px !important;
    border: none !important;
  }
  .fc-daygrid-event:hover {
    opacity: 0.9;
  }

  /* Event content styles */
  .event-content {
    padding: 4px 6px;
    font-size: 11px;
    line-height: 1.3;
    white-space: normal;
    word-break: break-word;
    height: 100%;
    border-radius: 4px;
  }
  .event-service-name {
    font-weight: 600;
    margin-bottom: 2px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .event-email {
    font-size: 10px;
    opacity: 0.9;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Color classes - Applied to all views */
  .fc-bg-primary,
  .fc-bg-primary .fc-event-main {
    background-color: rgba(59, 130, 246, 0.95) !important;
    color: white !important;
  }
  .fc-bg-success,
  .fc-bg-success .fc-event-main {
    background-color: rgba(34, 197, 94, 0.95) !important;
    color: white !important;
  }
  .fc-bg-danger,
  .fc-bg-danger .fc-event-main {
    background-color: rgba(239, 68, 68, 0.95) !important;
    color: white !important;
  }
  .fc-bg-warning,
  .fc-bg-warning .fc-event-main {
    background-color: rgba(234, 179, 8, 0.95) !important;
    color: white !important;
  }
`;

export default calendarStyles;
