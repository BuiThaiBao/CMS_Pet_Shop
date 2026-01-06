import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import Switch from "../../components/form/switch/Switch";
import serviceApi from "../../services/api/serviceApi";
import Button from "../../components/ui/button/Button";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";

type TimeTemplate = {
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isDeleted?: string; // "0" = active, "1" = deleted/inactive
};

type ServiceItem = {
  id: number;
  name: string;
  title?: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  isActive?: string;
  createdDate?: string;
  updatedDate?: string;
  timeTemplates?: TimeTemplate[];
};

function Service() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    "asc"
  );
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [updatingBookingTimes, setUpdatingBookingTimes] = useState<
    Set<string>
  >(new Set());
  const [showAddTimeForm, setShowAddTimeForm] = useState<number | null>(null);
  const [newTimeSlot, setNewTimeSlot] = useState<{
    startTime: string;
    maxCapacity: string;
  }>({
    startTime: "",
    maxCapacity: "",
  });
  const [addingTimeSlot, setAddingTimeSlot] = useState<number | null>(null);

  // Tải dữ liệu
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      await fetchServices(pageNumber, pageSize, query);
    };
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize, query, sortDirection]);

  async function fetchServices(page: number, size: number, q?: string) {
    setLoading(true);
    setError(null);
    try {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch (e) {
          /* bỏ qua */
        }
      }
      const controller = new AbortController();
      abortRef.current = controller;
      const params: {
        pageNumber: number;
        size: number;
        search?: string;
        sort?: string;
      } = {
        pageNumber: page,
        size,
        search: q ?? undefined,
        sort: sortDirection ? `name,${sortDirection}` : undefined,
      };
      const res = await serviceApi.list(params, { signal: controller.signal });
      const data = res?.data?.result;
      if (data) {
        setItems(data.content || []);
        setTotalPages(data.totalPages ?? 0);
        setTotalElements(data.totalElements ?? 0);
        const serverPageRaw =
          typeof data.number === "number"
            ? data.number
            : (data.pageable?.pageNumber as number | undefined);
        const serverSize = data.size ?? data.pageable?.pageSize ?? size;

        let resolvedPage = page;
        if (typeof serverPageRaw === "number") {
          if (serverPageRaw === page - 1) {
            resolvedPage = serverPageRaw + 1;
          } else if (serverPageRaw === page) {
            resolvedPage = serverPageRaw;
          } else {
            if (serverPageRaw === 0 && page === 1) resolvedPage = 1;
            else resolvedPage = page;
          }
        }

        setPageNumber(resolvedPage);
        setPageSize(serverSize);
      } else {
        setItems([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === "ERR_CANCELED" || err?.name === "CanceledError") {
        return;
      }
      console.error(err);
      setError(err?.message || t('messages.loadError'));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setPageNumber(1);
      setQuery(searchInput.trim());
    }, 150);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function updateServiceToggle(
    id: number,
    field: "isActive",
    newVal: string
  ) {
    const prevItems = [...items];
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: newVal } : c))
    );
    const before = new Set(updatingIds);
    before.add(id);
    setUpdatingIds(before);
    try {
      const payload: any = {};
      payload[field] = newVal;
      await serviceApi.update(id, payload);
    } catch (err: any) {
      setItems(prevItems);
      setError(err?.message || t('service.updateError'));
    } finally {
      const after = new Set(updatingIds);
      after.delete(id);
      setUpdatingIds(after);
    }
  }

  function toggleSort() {
    if (sortDirection === "asc") setSortDirection("desc");
    else if (sortDirection === "desc") setSortDirection(null);
    else setSortDirection("asc");
    setPageNumber(1);
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  const formatTime = (timeString: string) => {
    // Format from "09:00:00" to "09:00"
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  const toggleDropdown = (serviceId: number) => {
    const isOpening = openDropdownId !== serviceId;
    setOpenDropdownId(isOpening ? serviceId : null);
    if (!isOpening) {
      // Close add form when closing dropdown
      setShowAddTimeForm(null);
      setNewTimeSlot({ startTime: "", maxCapacity: "" });
    }
  };

  const toggleAddTimeForm = (serviceId: number) => {
    setShowAddTimeForm(showAddTimeForm === serviceId ? null : serviceId);
    if (showAddTimeForm === serviceId) {
      // Reset form when closing
      setNewTimeSlot({ startTime: "", maxCapacity: "" });
    }
  };

  const handleAddTimeSlot = async (serviceId: number) => {
    if (!newTimeSlot.startTime || !newTimeSlot.maxCapacity) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setAddingTimeSlot(serviceId);
    const prevItems = [...items];

    // Optimistic update
    const newTemplate: TimeTemplate = {
      startTime: `${newTimeSlot.startTime}:00`,
      endTime: "", // Will be calculated by backend
      maxCapacity: Number(newTimeSlot.maxCapacity),
      isDeleted: "0",
    };
    setItems((prev) =>
      prev.map((service) => {
        if (service.id === serviceId) {
          return {
            ...service,
            timeTemplates: [...(service.timeTemplates || []), newTemplate],
          };
        }
        return service;
      })
    );

    try {
      await serviceApi.addTimeSlot({
        serviceId,
        startTime: newTimeSlot.startTime,
        maxCapacity: Number(newTimeSlot.maxCapacity),
      });

      // Reset form
      setNewTimeSlot({ startTime: "", maxCapacity: "" });
      setShowAddTimeForm(null);

      // Reload services to get updated data from server
      await fetchServices(pageNumber, pageSize, query);
    } catch (err: any) {
      // Revert on error
      setItems(prevItems);
      // Extract error message from API response
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to add time slot";
      setError(errorMessage);
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setAddingTimeSlot(null);
    }
  };

  const updateBookingTimeStatus = async (
    serviceId: number,
    startTime: string,
    newIsDeleted: "0" | "1"
  ) => {
    const timeOnly = startTime.substring(0, 5); // "09:00:00" -> "09:00"
    const key = `${serviceId}-${timeOnly}`;
    const prevItems = [...items];

    // Optimistic update: update isDeleted in timeTemplates
    setItems((prev) =>
      prev.map((service) => {
        if (service.id === serviceId && service.timeTemplates) {
          return {
            ...service,
            timeTemplates: service.timeTemplates.map((template) => {
              const templateTimeOnly = template.startTime.substring(0, 5);
              if (templateTimeOnly === timeOnly) {
                return { ...template, isDeleted: newIsDeleted };
              }
              return template;
            }),
          };
        }
        return service;
      })
    );

    const updating = new Set(updatingBookingTimes);
    updating.add(key);
    setUpdatingBookingTimes(updating);

    try {
      await serviceApi.updateBookingTimeActive({
        serviceId,
        time: timeOnly,
        isDeleted: newIsDeleted, // "0" = active (green), "1" = deleted/inactive (red)
      });
    } catch (err: any) {
      // Revert on error
      setItems(prevItems);
      setError(err?.message || t('service.updateTimeSlotError'));
    } finally {
      const after = new Set(updatingBookingTimes);
      after.delete(key);
      setUpdatingBookingTimes(after);
    }
  };

  return (
    <>
      <PageMeta title={t('service.title')} description={t('service.serviceList')} />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{t('service.serviceList')}</h1>
            <p className="mt-2 text-sm text-gray-600">{t('service.manageServices')}</p>
          </div>
          <Button
            onClick={() => navigate("/service/add")}
            size="md"
            className="bg-indigo-600"
          >
            + {t('service.addService')}
          </Button>
        </div>
        <div className="mt-4 bg-white rounded-lg border">
          {error && (
            <div className="p-4">
              <Alert variant="error" title={t('common.error')} message={error} />
            </div>
          )}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder={t('service.searchByName')}
                className="border rounded px-3 py-2 flex-1"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      <button
                        onClick={toggleSort}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        {t('service.serviceName')}
                        {sortDirection === "asc" && <span>↑</span>}
                        {sortDirection === "desc" && <span>↓</span>}
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('service.title')}
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('common.description')}
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('service.duration')} (min)
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('service.price')}
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('service.timeSlots')}
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('common.status')}
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-gray-500"
                      >
                        {t('service.noServices')}
                      </td>
                    </tr>
                  ) : (
                    items.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm">{s.id}</td>
                        <td className="py-4 px-4 text-sm font-medium">
                          {s.name}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {s.title || "-"}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {s.description
                            ? s.description.substring(0, 50) +
                            (s.description.length > 50 ? "..." : "")
                            : "-"}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {s.durationMinutes ? `${s.durationMinutes} min` : "-"}
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold text-indigo-600">
                          {s.price ? formatCurrency(s.price) : "-"}
                        </td>
                        <td className="py-4 px-4">
                          {s.timeTemplates && s.timeTemplates.length > 0 ? (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => toggleDropdown(s.id)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors dropdown-toggle"
                              >
                                <span>
                                  {s.timeTemplates.length} {t('service.timeSlot')}
                                </span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`h-4 w-4 transition-transform ${openDropdownId === s.id
                                    ? "rotate-180"
                                    : ""
                                    }`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>
                              <Dropdown
                                isOpen={openDropdownId === s.id}
                                onClose={() => setOpenDropdownId(null)}
                                className="min-w-[320px] max-h-[300px] overflow-y-auto"
                              >
                                <div className="py-2">
                                  <div className="px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                                    <span className="text-xs font-semibold text-gray-500 uppercase">
                                      {t('service.timeSlots')}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAddTimeForm(s.id);
                                      }}
                                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                                    >
                                      + {t('service.addTime')}
                                    </button>
                                  </div>
                                  {showAddTimeForm === s.id && (
                                    <div
                                      className="px-4 py-3 border-b border-gray-200 bg-gray-50"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1">
                                            <label className="block text-xs text-gray-600 mb-1">
                                              {t('service.startTime')}
                                            </label>
                                            <input
                                              type="text"
                                              value={newTimeSlot.startTime}
                                              onChange={(e) => {
                                                // Only allow HH:mm format
                                                const value = e.target.value;
                                                if (value === '' || /^([0-1]?[0-9]|2[0-3])?(:[0-5]?[0-9]?)?$/.test(value)) {
                                                  setNewTimeSlot({
                                                    ...newTimeSlot,
                                                    startTime: value,
                                                  });
                                                }
                                              }}
                                              onBlur={(e) => {
                                                // Format on blur (e.g., "9:0" -> "09:00")
                                                const value = e.target.value;
                                                const match = value.match(/^(\d{1,2}):(\d{1,2})$/);
                                                if (match) {
                                                  const hours = match[1].padStart(2, '0');
                                                  const mins = match[2].padStart(2, '0');
                                                  setNewTimeSlot({
                                                    ...newTimeSlot,
                                                    startTime: `${hours}:${mins}`,
                                                  });
                                                }
                                              }}
                                              className="w-full border rounded px-2 py-1.5 text-sm"
                                              placeholder="HH:mm (VD: 09:00, 14:00)"
                                              pattern="([0-1]?[0-9]|2[0-3]):[0-5][0-9]"
                                              aria-label="Start Time"
                                              title="Start Time - Nhập theo định dạng 24 giờ (VD: 09:00, 14:00)"
                                              disabled={addingTimeSlot === s.id}
                                            />
                                          </div>
                                          <div className="w-24">
                                            <label className="block text-xs text-gray-600 mb-1">
                                              {t('service.capacity')}
                                            </label>
                                            <input
                                              type="number"
                                              value={newTimeSlot.maxCapacity}
                                              onChange={(e) =>
                                                setNewTimeSlot({
                                                  ...newTimeSlot,
                                                  maxCapacity: e.target.value,
                                                })
                                              }
                                              className="w-full border rounded px-2 py-1.5 text-sm"
                                              placeholder={t('service.max')}
                                              min="1"
                                              aria-label="Max Capacity"
                                              title="Max Capacity"
                                              disabled={addingTimeSlot === s.id}
                                            />
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleAddTimeSlot(s.id)}
                                            disabled={addingTimeSlot === s.id}
                                            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {addingTimeSlot === s.id ? t('common.adding') : t('common.add')}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setShowAddTimeForm(null);
                                              setNewTimeSlot({
                                                startTime: "",
                                                maxCapacity: "",
                                              });
                                            }}
                                            disabled={addingTimeSlot === s.id}
                                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {t('common.cancel')}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {s.timeTemplates.map((template, index) => {
                                    const timeOnly = template.startTime.substring(
                                      0,
                                      5
                                    );
                                    // isDeleted "0" = active (green), "1" = deleted/inactive (red)
                                    const isDeleted = template.isDeleted || "0";
                                    const isActive = isDeleted === "0";
                                    const key = `${s.id}-${timeOnly}`;
                                    const isUpdating =
                                      updatingBookingTimes.has(key);

                                    return (
                                      <div
                                        key={index}
                                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                        onClick={(e) => {
                                          // Prevent closing dropdown when clicking on item
                                          e.stopPropagation();
                                        }}
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="font-medium whitespace-nowrap">
                                              {formatTime(template.startTime)} -{" "}
                                              {formatTime(template.endTime)}
                                            </span>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                              {t('service.capacity')}: {template.maxCapacity}
                                            </span>
                                          </div>
                                          <div
                                            className="flex items-center gap-2"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Switch
                                              key={`${key}-${isDeleted}`}
                                              defaultChecked={isActive}
                                              onChange={(checked) =>
                                                updateBookingTimeStatus(
                                                  s.id,
                                                  template.startTime,
                                                  checked ? "0" : "1"
                                                )
                                              }
                                              disabled={isUpdating}
                                              label=""
                                              color={isActive ? "green" : "red"}
                                            />
                                            <span
                                              className={`text-xs font-medium min-w-[60px] ${isActive
                                                ? "text-green-600"
                                                : "text-red-600"
                                                }`}
                                            >
                                              {isActive ? t('common.active') : t('service.inactive')}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </Dropdown>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Switch
                              key={`${s.id}-${s.isActive}`}
                              defaultChecked={s.isActive === "1"}
                              onChange={(checked) =>
                                updateServiceToggle(
                                  s.id,
                                  "isActive",
                                  checked ? "1" : "0"
                                )
                              }
                              disabled={updatingIds.has(s.id)}
                              label=""
                              color={s.isActive === "1" ? "green" : "red"}
                            />
                            <span
                              className={`text-sm font-medium ${s.isActive === "1"
                                ? "text-green-600"
                                : "text-red-600"
                                }`}
                            >
                              {s.isActive === "1" ? t('common.active') : t('service.inactive')}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                            onClick={() =>
                              navigate(`/service/edit/${s.id}`, {
                                state: {
                                  serviceData: {
                                    name: s.name,
                                    title: s.title,
                                    description: s.description,
                                    durationMinutes: s.durationMinutes,
                                    price: s.price,
                                    isActive: s.isActive,
                                    timeTemplates: s.timeTemplates || [],
                                  },
                                },
                              })
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            {t('common.edit')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {t('common.showing')} {items.length} {t('common.of')} {totalElements} {t('service.services')}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber <= 1}
                  aria-label="Previous page"
                  className={`w-9 h-9 flex items-center justify-center border rounded-lg ${pageNumber <= 1
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                    }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {Array.from({ length: Math.max(totalPages, 0) }).map(
                  (_, idx) => {
                    const p = idx + 1;
                    const active = p === pageNumber;
                    return (
                      <button
                        key={p}
                        onClick={() => setPageNumber(p)}
                        aria-current={active ? "page" : undefined}
                        className={`transition-all ${active
                          ? "w-9 h-9 flex items-center justify-center text-sm rounded-md bg-indigo-600 text-white shadow"
                          : "px-2 text-sm text-gray-700"
                          }`}
                      >
                        {p}
                      </button>
                    );
                  }
                )}

                <button
                  onClick={() => {
                    const target = pageNumber + 1;
                    if (totalPages && target > totalPages) return;
                    setPageNumber(target);
                  }}
                  disabled={totalPages ? pageNumber >= totalPages : false}
                  aria-label="Next page"
                  className={`w-9 h-9 flex items-center justify-center border rounded-lg ${totalPages && pageNumber >= totalPages
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                    }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Service;
