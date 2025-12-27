import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import serviceApi from "../../services/api/serviceApi";
import Select from "../../components/form/Select";
import { PlusIcon, TrashBinIcon } from "../../icons";

export default function ServiceAdd() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | string>("");
  const [price, setPrice] = useState<number | string>("");
  const [bookingTimes, setBookingTimes] = useState([{ startTime: "", maxCapacity: "" }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const serviceOptions = [
    { value: "veterinary", label: "Dịch vụ thú y" },
    { value: "grooming", label: "Chăm sóc/ Tắm rửa" },
    { value: "haircut", label: "Cắt tỉa lông" },
    { value: "vaccination", label: "Tiêm chủng" },
    { value: "petboarding", label: "Lưu trú thú cưng" },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        name,
        title,
        description,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        price: price ? Number(price) : undefined,
        bookingTimes: bookingTimes.map(slot => ({
          startTime: slot.startTime,
          maxCapacity: Number(slot.maxCapacity)
        })),
      };
      const res = await serviceApi.create(payload);
      const data = res?.data;
      if (data?.success || data?.code === 1000) {
        setMessage("Create service successfully");
        setTimeout(() => {
          navigate("/service");
        }, 1500);
      } else {
        setError(data?.message || "Unknown response");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setName("");
    setTitle("");
    setDescription("");
    setDurationMinutes("");
    setPrice("");
    setBookingTimes([{ startTime: "", maxCapacity: "" }]);
  };

  return (
    <>
      <PageMeta title="Add Service" description="Create a new service" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Service</h2>
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
                defaultValue=""
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

          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-2">Booking Times</label>
            {bookingTimes.map((slot, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => {
                    const newSlots = [...bookingTimes];
                    newSlots[index].startTime = e.target.value;
                    setBookingTimes(newSlots);
                  }}
                  className="border rounded px-3 py-2"
                  required
                />
                <input
                  type="number"
                  value={slot.maxCapacity}
                  onChange={(e) => {
                    const newSlots = [...bookingTimes];
                    newSlots[index].maxCapacity = e.target.value;
                    setBookingTimes(newSlots);
                  }}
                  className="border rounded px-3 py-2 w-20"
                  placeholder="Max"
                  min="1"
                  required
                />
                {bookingTimes.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBookingTimes(bookingTimes.filter((_, i) => i !== index));
                    }}
                  >
                    <TrashBinIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBookingTimes([...bookingTimes, { startTime: "", maxCapacity: "" }])}
            >
              Add Slot
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button
              size="md"
              type="submit"
              disabled={loading}
              className="bg-indigo-600"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button size="md" variant="outline" type="button" onClick={reset}>
              Reset
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
