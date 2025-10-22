import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import serviceApi from "../../services/api/serviceApi";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";

export default function ServiceEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | string>("");
  const [price, setPrice] = useState<number | string>("");
  const [isActive, setIsActive] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoadingData(true);
      setError(null);
      try {
        const res = await serviceApi.getById(id);
        const data = res?.data?.result ?? res?.data;
        if (data) {
          setName(data.name ?? "");
          setTitle(data.title ?? "");
          setDescription(data.description ?? "");
          setDurationMinutes(data.durationMinutes ?? "");
          setPrice(data.price ?? "");
          setIsActive(data.isActive ?? "");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load service");
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
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
        isActive: isActive ? (isActive as "0" | "1") : undefined,
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
                Service Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="Enter service name"
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
