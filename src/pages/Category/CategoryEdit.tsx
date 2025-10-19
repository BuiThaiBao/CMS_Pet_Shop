import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import categoryApi from "../../services/api/categoryApi";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";

export default function CategoryEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState<"0" | "1">("0");
  const [isDeleted, setIsDeleted] = useState<"0" | "1">("0");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // API base đã được cấu hình trong http.ts

  // Tải dữ liệu category theo id khi mở trang (GET /categories/:id)
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await categoryApi.getById(id);
        const data = res?.data?.result ?? res?.data;
        if (data) {
          setName(data.name ?? "");
          setDescription(data.description ?? "");
          const to01 = (v: any): "0" | "1" =>
            v === "1" || v === 1 || v === true || v === "true" ? "1" : "0";
          setIsFeatured(to01(data.isFeatured));
          setIsDeleted(to01(data.isDeleted));
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load category");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Submit cập nhật category (PUT JSON /categories/:id)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = { name, description, isDeleted, isFeatured } as const;
      const res = await categoryApi.update(id, payload);
      const data = res?.data;
      if (data?.success || data?.code === 1000) {
        setMessage("Update category successfully");
        setTimeout(() => navigate("/category"), 600);
      } else {
        setError(data?.message || "Unknown response");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Edit Category" description={`Edit category #${id}`} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Category</h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Category Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="Enter category name"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Featured
              </label>
              <select
                value={isFeatured}
                onChange={(e) => setIsFeatured(e.target.value as any)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Deleted
              </label>
              <select
                value={isDeleted}
                onChange={(e) => setIsDeleted(e.target.value as any)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
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

          <div className="mt-4 flex items-center gap-3">
            <Button
              size="md"
              type="submit"
              disabled={loading}
              className="bg-indigo-600"
            >
              {loading ? "Saving..." : "Save changes"}
            </Button>
            <Button
              size="md"
              variant="outline"
              type="button"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
