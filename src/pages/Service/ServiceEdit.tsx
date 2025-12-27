import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import serviceApi, { BookingTimeUpdate } from "../../services/api/serviceApi";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import Select from "../../components/form/Select";

type TimeTemplate = {
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isDeleted?: string; // "0" = active, "1" = deleted/inactive
};

type TimeTemplateEdit = {
  oldTime: string; // Format: "08:00" (from startTime)
  newTime: string; // Input value for new time
  maxCapacity: string; // Input value for new capacity
  originalCapacity: number; // Original capacity for reference
};

export default function ServiceEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | string>("");
  const [price, setPrice] = useState<number | string>("");
  const [isActive, setIsActive] = useState<string>("");
  const [timeTemplates, setTimeTemplates] = useState<TimeTemplate[]>([]);
  const [timeTemplateEdits, setTimeTemplateEdits] = useState<
    TimeTemplateEdit[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const serviceOptions = [
    { value: "veterinary", label: "Dịch vụ thú y" },
    { value: "grooming", label: "Chăm sóc/ Tắm rửa" },
    { value: "haircut", label: "Cắt tỉa lông" },
    { value: "vaccination", label: "Tiêm chủng" },
    { value: "petboarding", label: "Lưu trú thú cưng" },
  ];

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoadingData(true);
      setError(null);
      try {
        // Check if data was passed via navigation state
        const stateData = location.state as
          | { serviceData?: any }
          | null
          | undefined;
        const passedData = stateData?.serviceData;

        let data: any = null;

        if (passedData) {
          // Use data from navigation state
          data = passedData;
          console.log("Using data from navigation state:", data);
        } else {
          // Fallback to API call
          const res = await serviceApi.getById(id);
          data = res?.data?.result ?? res?.data;
          console.log("Service data loaded from API:", data);
        }

        if (data) {
          setName(data.name ?? "");
          setTitle(data.title ?? "");
          setDescription(data.description ?? "");
          setDurationMinutes(data.durationMinutes ?? "");
          setPrice(data.price ?? "");
          setIsActive(data.isActive ?? "");

          // Load time templates - only show those with isDeleted = "0" (active)
          const allTemplates: TimeTemplate[] = data.timeTemplates || [];
          const activeTemplates = allTemplates.filter(
            (template) => template.isDeleted === "0" || !template.isDeleted
          );
          console.log("Time templates loaded:", activeTemplates);
          setTimeTemplates(activeTemplates);

          // Initialize edit state for each template
          const edits: TimeTemplateEdit[] = activeTemplates.map((template) => {
            const startTimeOnly = template.startTime
              ? template.startTime.substring(0, 5) // "09:00:00" -> "09:00"
              : "";
            return {
              oldTime: startTimeOnly,
              newTime: startTimeOnly,
              maxCapacity: template.maxCapacity?.toString() || "",
              originalCapacity: template.maxCapacity || 0,
            };
          });
          setTimeTemplateEdits(edits);
        }
      } catch (err: any) {
        console.error("Error loading service:", err);
        setError(err?.message || "Failed to load service");
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [id, location.state]);

  const formatTime = (timeString: string) => {
    // Format from "09:00:00" to "09:00"
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  const updateTimeTemplateEdit = (
    index: number,
    field: "newTime" | "maxCapacity",
    value: string
  ) => {
    setTimeTemplateEdits((prev) =>
      prev.map((edit, i) =>
        i === index ? { ...edit, [field]: value } : edit
      )
    );
  };

  const buildBookingTimeUpdates = (): BookingTimeUpdate[] => {
    return timeTemplateEdits
      .map((edit) => {
        const newTimeValue = edit.newTime.trim() || null;
        const maxCapacityValue = edit.maxCapacity.trim()
          ? Number(edit.maxCapacity)
          : null;

        // Only include if there are changes
        const timeChanged = newTimeValue !== null && newTimeValue !== edit.oldTime;
        const capacityChanged =
          maxCapacityValue !== null &&
          maxCapacityValue !== edit.originalCapacity;

        if (timeChanged || capacityChanged) {
          return {
            oldTime: edit.oldTime,
            newTime: timeChanged ? newTimeValue : null,
            maxCapacity: capacityChanged ? maxCapacityValue : null,
          };
        }
        return null;
      })
      .filter((update): update is BookingTimeUpdate => update !== null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const bookingTimeUpdates = buildBookingTimeUpdates();
      
      const payload = {
        name,
        title,
        description,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        price: price ? Number(price) : undefined,
        isActive: isActive ? (isActive as "0" | "1") : undefined,
        ...(bookingTimeUpdates.length > 0 && { bookingTimeUpdates }),
      };
      const res = await serviceApi.update(id, payload);
      const data = res?.data;
      if (data?.success || data?.code === 1000) {
        setMessage("Update service successfully");
        setTimeout(() => navigate("/service"), 1500);
      } else {
        setError(data?.message || "Unknown response");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update service");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <>
        <PageMeta title="Edit Service" description={`Edit service #${id}`} />
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Edit Service" description={`Edit service #${id}`} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Service</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/service")}
          >
            ← Back to List
          </Button>
        </div>

        <form onSubmit={submit} className="bg-white border rounded-lg p-6">
          {error && (
            <div className="mb-3">
              <Alert variant="error" title="Error" message={error} />
            </div>
          )}
          {message && (
            <div className="mb-3">
              <Alert variant="success" title="Success" message={message} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Tên dịch vụ *
              </label>
              <Select
                options={serviceOptions}
                onChange={setName}
                defaultValue={name}
                placeholder="Chọn loại dịch vụ"
                required
                dropdown
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter service title"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2 h-36"
              placeholder="Description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter duration"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Price (VND)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter price"
                min="0"
              />
            </div>
          </div>

          {/* Time Templates Section */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-md font-semibold text-gray-700 mb-4">
              Quản lý khung giờ
            </h3>
            {timeTemplates.length === 0 ? (
              <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p>Không có khung giờ nào cho dịch vụ này.</p>
                <p className="mt-1 text-xs">
                  Nếu dịch vụ có khung giờ nhưng không hiển thị ở đây, vui lòng kiểm tra lại API response.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {timeTemplateEdits.map((edit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        Khung giờ hiện tại
                      </div>
                      <div className="text-sm text-gray-800">
                        {formatTime(
                          timeTemplates[index]?.startTime || ""
                        )}{" "}
                        - {formatTime(timeTemplates[index]?.endTime || "")}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Số lượng hiện tại: {edit.originalCapacity}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">
                        Giờ mới (HH:mm)
                      </label>
                      <input
                        type="time"
                        value={edit.newTime}
                        onChange={(e) =>
                          updateTimeTemplateEdit(
                            index,
                            "newTime",
                            e.target.value
                          )
                        }
                        className="w-full border rounded px-3 py-2"
                        placeholder="08:00"
                        step="60"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">
                        Số lượng mới (maxCapacity)
                      </label>
                      <input
                        type="number"
                        value={edit.maxCapacity}
                        onChange={(e) =>
                          updateTimeTemplateEdit(
                            index,
                            "maxCapacity",
                            e.target.value
                          )
                        }
                        className="w-full border rounded px-3 py-2"
                        placeholder="Nhập số lượng"
                        min="1"
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        Để trống nếu không đổi
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {timeTemplates.length > 0 && (
              <div className="mt-4 text-sm text-gray-500">
                <p>
                  • Để đổi giờ: Nhập giờ mới vào trường "Giờ mới"
                </p>
                <p>
                  • Để đổi số lượng: Nhập số lượng mới vào trường "Số lượng mới" (để trống nếu không đổi)
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Lưu ý: Chỉ hiển thị các khung giờ đang active (isDeleted = 0)
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button
              size="md"
              type="submit"
              disabled={loading}
              className="bg-indigo-600"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              size="md"
              variant="outline"
              type="button"
              onClick={() => navigate("/service")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
