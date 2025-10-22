import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import productApi from "../../services/api/productApi";
import Select from "../../components/form/Select";
import categoryApi from "../../services/api/categoryApi";

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [categoryId, setCategoryId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [shortDescription, setShortDescription] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState<string>("0");
  const [isDeleted, setIsDeleted] = useState<string>("0");

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [catOptions, setCatOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [catLoading, setCatLoading] = useState<boolean>(false);
  const catAbortRef = useRef<AbortController | null>(null);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      setLoadingData(true);
      setError(null);
      try {
        const res = await productApi.getById(id);
        const data = res?.data?.result ?? res?.data;
        if (data) {
          setName(data.name || "");
          setShortDescription(data.shortDescription || "");
          setDescription(data.description || "");
          setCategoryId(data.categoryId ? String(data.categoryId) : "");
          setIsFeatured(data.isFeatured || "0");
          setIsDeleted(data.isDeleted || "0");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load product");
      } finally {
        setLoadingData(false);
      }
    };
    loadProduct();
  }, [id]);

  // Fetch categories for dropdown
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setCatLoading(true);
      try {
        if (catAbortRef.current) {
          try {
            catAbortRef.current.abort();
          } catch {}
        }
        const controller = new AbortController();
        catAbortRef.current = controller;
        const res = await categoryApi.list(
          { pageNumber: 1, size: 1000, sort: "name,asc" },
          { signal: controller.signal }
        );
        const data = res?.data?.result ?? res?.data;
        const content = data?.content ?? data?.items ?? [];
        if (!mounted) return;
        const options = Array.isArray(content)
          ? content.map((c: any) => ({
              value: String(c.id),
              label: String(c.name ?? c.id),
            }))
          : [];
        setCatOptions(options);
      } catch (err: any) {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError")
          return;
        console.error("Failed to load categories", err);
      } finally {
        setCatLoading(false);
        catAbortRef.current = null;
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        categoryId: categoryId ? Number(categoryId) : undefined,
        name,
        shortDescription,
        description,
        isFeatured: isFeatured as "0" | "1",
        isDeleted: isDeleted as "0" | "1",
      };
      const res = await productApi.update(id, payload);
      const data = res?.data;
      if (data?.success || data?.code === 1000) {
        setMessage("Update product successfully");
        setTimeout(() => {
          navigate("/product");
        }, 1500);
      } else {
        setError(data?.message || "Unknown response");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <>
        <PageMeta title="Edit Product" description="Edit product information" />
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
      <PageMeta title="Edit Product" description="Edit product information" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Product</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/product")}
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
                Category
              </label>
              <div className="max-w-xs">
                <Select
                  options={catOptions}
                  placeholder={
                    catLoading ? "Loading categories..." : "Select a category"
                  }
                  onChange={(val) => setCategoryId(val)}
                  className=""
                  defaultValue={categoryId}
                  compact
                  rows={6}
                  dropdown
                  searchable
                  showSearchInput={false}
                  searchInTrigger
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="Enter product name"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">
              Short Description
            </label>
            <input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Short description"
            />
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
                Featured
              </label>
              <select
                value={isFeatured}
                onChange={(e) => setIsFeatured(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={isDeleted}
                onChange={(e) => setIsDeleted(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="0">Active</option>
                <option value="1">Deleted</option>
              </select>
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
              onClick={() => navigate("/product")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
