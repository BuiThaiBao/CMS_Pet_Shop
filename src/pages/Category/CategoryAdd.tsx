import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import categoryApi from "../../services/api/categoryApi";

export default function CategoryAdd() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState<"0" | "1">("0");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // API base đã được cấu hình trong http.ts

  // Xử lý submit tạo mới category (POST JSON)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = { name, description, isFeatured } as const;
      const res = await categoryApi.create(payload);
      const data = res?.data;
      if (data?.success || data?.code === 1000) {
        setMessage("Create category successfully");
        // Tự động quay lại trang list sau 1 giây
        setTimeout(() => {
          navigate("/category");
        }, 1000);
      } else {
        setError(data?.message || "Unknown response");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Add Category" description="Create a new category" />
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Add Category</h2>

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

          <div className="mt-4">
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

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured === "1"}
              onChange={(e) => setIsFeatured(e.target.checked ? "1" : "0")}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="isFeatured"
              className="text-sm text-gray-700 cursor-pointer"
            >
              Featured Category
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button
              size="md"
              type="submit"
              disabled={loading}
              className="bg-indigo-600"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button
              size="md"
              variant="outline"
              type="button"
              onClick={() => navigate("/category")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
