import { useEffect, useState, useRef } from "react";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import Switch from "../../components/form/switch/Switch";
import categoryApi from "../../services/api/categoryApi";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

type CategoryItem = {
  id: number;
  name: string;
  description?: string;
  isFeatured?: string;
  isDeleted?: string;
  createdDate?: string;
  updatedDate?: string;
};

function Category() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set()); // theo dõi id đang cập nhật
  const [query, setQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    "asc"
  );
  const [filterPanelOpen, setFilterPanelOpen] = useState<boolean>(false);
  const [filterFeatured, setFilterFeatured] = useState<"all" | "1" | "0">(
    "all"
  );
  const [filterDeleted, setFilterDeleted] = useState<"all" | "1" | "0">("all");

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const editAbortRef = useRef<AbortController | null>(null);

  // API base đã được cấu hình trong http.ts

  // Khởi tạo filter từ URL nếu có (chạy một lần khi mount)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const f = url.searchParams.get("feature");
      const d = url.searchParams.get("deleted");
      if (f === "1" || f === "0") setFilterFeatured(f);
      if (d === "1" || d === "0") setFilterDeleted(d);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đồng bộ filterFeatured vào URL để khi refresh/back vẫn giữ được lựa chọn
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (filterFeatured && filterFeatured !== "all") {
        url.searchParams.set("feature", filterFeatured);
      } else {
        url.searchParams.delete("feature");
      }
      if (filterDeleted && filterDeleted !== "all") {
        url.searchParams.set("deleted", filterDeleted);
      } else {
        url.searchParams.delete("deleted");
      }
      window.history.replaceState({}, "", url.toString());
    } catch (e) {
      // Bỏ qua trong môi trường SSR hoặc nơi không có đối tượng URL
    }
  }, [filterFeatured, filterDeleted]);

  // Hàm tải dữ liệu trung tâm: tự động chạy khi thay đổi trang, kích thước trang, từ khóa, sắp xếp và trạng thái bộ lọc
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      if (filterFeatured === "1" || filterFeatured === "0") {
        await fetchFeatured(pageNumber, pageSize, filterFeatured as "1" | "0");
      } else if (filterDeleted === "1" || filterDeleted === "0") {
        await fetchDeleted(pageNumber, pageSize, filterDeleted as "1" | "0");
      } else {
        await fetchCategories(pageNumber, pageSize, query);
      }
    };
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pageNumber,
    pageSize,
    query,
    sortDirection,
    filterFeatured,
    filterDeleted,
  ]);

  // Gọi API GET /categories (phân trang 1-based, hỗ trợ tìm kiếm và sắp xếp)
  async function fetchCategories(page: number, size: number, q?: string) {
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
      const res = await categoryApi.list(params, { signal: controller.signal });
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

        let resolvedPage = page; // default to requested page
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
      setError(err?.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  // Trì hoãn (debounce) việc cập nhật query từ ô tìm kiếm để giảm số lần gọi API
  useEffect(() => {
    const t = setTimeout(() => {
      setPageNumber(1);
      setQuery(searchInput.trim());
    }, 150);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Gọi API POST x-www-form-urlencoded /categories/feature với isFeature=1|0
  async function fetchFeatured(
    page: number,
    size: number,
    isFeature: "1" | "0"
  ) {
    setLoading(true);
    setError(null);
    try {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch (e) {}
      }
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await categoryApi.feature(
        {
          pageNumber: page,
          size,
          isFeature,
          sort: sortDirection ? `name,${sortDirection}` : undefined,
          search: query || undefined,
        },
        { signal: controller.signal }
      );

      const data = res?.data?.result ?? res?.data;
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
          if (serverPageRaw === page - 1) resolvedPage = serverPageRaw + 1;
          else if (serverPageRaw === page) resolvedPage = serverPageRaw;
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
      if (code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      console.error(err);
      setError(err?.message || "Failed to fetch featured categories");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  // Gọi API POST x-www-form-urlencoded /categories/delete với isDeleted=1|0
  async function fetchDeleted(
    page: number,
    size: number,
    isDeleted: "1" | "0"
  ) {
    setLoading(true);
    setError(null);
    try {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch (e) {}
      }
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await categoryApi.deleted(
        {
          pageNumber: page,
          size,
          isDeleted,
          sort: sortDirection ? `name,${sortDirection}` : undefined,
          search: query || undefined,
        },
        { signal: controller.signal }
      );

      const data = res?.data?.result ?? res?.data;
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
          if (serverPageRaw === page - 1) resolvedPage = serverPageRaw + 1;
          else if (serverPageRaw === page) resolvedPage = serverPageRaw;
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
      if (code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      console.error(err);
      setError(err?.message || "Failed to fetch deleted categories");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  // Bật/tắt trường isFeatured | isDeleted và cập nhật server
  async function handleToggleField(
    id: number,
    field: "isFeatured" | "isDeleted",
    checked: boolean
  ) {
    const newValue: "0" | "1" = checked ? "1" : "0";
    const current = items.find((it) => it.id === id);
    if (!current) return;

    const prevItems = items;
    const nextItems = items.map((it) => {
      if (it.id !== id) return it;
      const updated: CategoryItem = {
        ...it,
        [field]: newValue,
      } as CategoryItem;
      // Nếu đánh dấu deleted=1 thì đồng thời tắt featured=0
      if (field === "isDeleted" && newValue === "1") {
        updated.isFeatured = "0";
      }
      return updated;
    });
    setItems(nextItems);
    const setCopy = new Set(updatingIds);
    setCopy.add(id);
    setUpdatingIds(setCopy);

    try {
      const computedIsFeatured: "0" | "1" =
        field === "isFeatured"
          ? newValue
          : field === "isDeleted" && newValue === "1"
          ? "0"
          : (current.isFeatured as "0" | "1" | undefined) ?? "0";

      const payload = {
        name: current.name,
        description: current.description ?? "",
        isFeatured: computedIsFeatured,
        isDeleted: (field === "isDeleted"
          ? newValue
          : (current.isDeleted as "0" | "1" | undefined) ?? "0") as "0" | "1",
      };
      await categoryApi.update(id, payload);
    } catch (err: any) {
      setItems(prevItems); // revert khi lỗi
      setError(err?.message || "Failed to update category");
    } finally {
      const after = new Set(updatingIds);
      after.delete(id);
      setUpdatingIds(after);
    }
  }

  // Open Edit modal and load item
  async function openEditModal(id: number) {
    setEditError(null);
    setEditLoading(true);
    setEditOpen(true);
    setEditId(id);
    try {
      if (editAbortRef.current) {
        try {
          editAbortRef.current.abort();
        } catch {}
      }
      const controller = new AbortController();
      editAbortRef.current = controller;
      const res = await categoryApi.getById(id);
      const data = res?.data?.result ?? res?.data;
      setEditName(data?.name ?? "");
      setEditDescription(data?.description ?? "");
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      setEditError(err?.message || "Failed to load category");
    } finally {
      setEditLoading(false);
      editAbortRef.current = null;
    }
  }

  function closeEditModal() {
    if (editAbortRef.current) {
      try {
        editAbortRef.current.abort();
      } catch {}
      editAbortRef.current = null;
    }
    setEditOpen(false);
    setEditId(null);
    setEditName("");
    setEditDescription("");
    setEditError(null);
  }

  async function handleEditSave() {
    if (!editId) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const current = items.find((it) => it.id === editId);
      const payload = {
        name: editName.trim(),
        description: editDescription ?? "",
        isFeatured: (current?.isFeatured as "0" | "1" | undefined) ?? "0",
        isDeleted: (current?.isDeleted as "0" | "1" | undefined) ?? "0",
      };
      await categoryApi.update(editId, payload);
      // update list locally
      setItems((prev) =>
        prev.map((it) =>
          it.id === editId
            ? { ...it, name: payload.name, description: payload.description }
            : it
        )
      );
      closeEditModal();
    } catch (err: any) {
      setEditError(err?.message || "Failed to update category");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <>
      <PageMeta title="Category" description="Category list" />

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Category List</h1>
            <p className="mt-2 text-sm text-gray-600">Manage categories</p>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-lg border">
          {error && (
            <div className="p-4">
              <Alert variant="error" title="Error" message={error} />
            </div>
          )}
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Categories List
                </label>
                <div className="relative w-80">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search..."
                    aria-label="Search categories"
                    className="w-full pl-11 pr-10 py-2 rounded-lg border focus:outline-none focus:ring"
                  />

                  {/* Hiển thị biểu tượng loading bên trong ô tìm kiếm */}
                  {loading && (
                    <span className="absolute inset-y-0 right-3 flex items-center">
                      <svg
                        className="animate-spin h-5 w-5 text-gray-500"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterPanelOpen((s) => !s)}
                  className="inline-flex items-center gap-3 px-4 py-2 border rounded-md bg-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M3 5h18M6 12h12M10 19h4"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="font-semibold text-base">Filter</span>
                </button>

                {filterPanelOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border rounded-md shadow-lg p-4 z-20">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Feature
                      </label>
                      <select
                        value={filterFeatured}
                        onChange={(e) =>
                          setFilterFeatured(e.target.value as any)
                        }
                        className="mt-1 w-full border rounded px-2 py-1"
                      >
                        <option value="all">All</option>
                        <option value="1">Featured</option>
                        <option value="0">Not Featured</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Deleted
                      </label>
                      <select
                        value={filterDeleted}
                        onChange={(e) =>
                          setFilterDeleted(e.target.value as any)
                        }
                        className="mt-1 w-full border rounded px-2 py-1"
                      >
                        <option value="all">All</option>
                        <option value="1">Deleted</option>
                        <option value="0">Not Deleted</option>
                      </select>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => {
                          setFilterPanelOpen(false);
                          setPageNumber(1);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-gray-500 border-b">
                    <th className="py-3 px-4">
                      <div className="inline-flex items-center gap-2">
                        <span>Category</span>
                        <div className="flex flex-col items-center text-gray-400">
                          <button
                            type="button"
                            onClick={() => {
                              setSortDirection("asc");
                              setPageNumber(1);
                            }}
                            aria-label="Sort ascending"
                            className={`p-0.5 ${
                              sortDirection === "asc" ? "text-brand-500" : ""
                            }`}
                          >
                            <svg
                              width="10"
                              height="6"
                              viewBox="0 0 10 6"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 0L9.33013 6H0.669873L5 0Z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSortDirection("desc");
                              setPageNumber(1);
                            }}
                            aria-label="Sort descending"
                            className={`p-0.5 ${
                              sortDirection === "desc" ? "text-brand-500" : ""
                            }`}
                          >
                            <svg
                              width="10"
                              height="6"
                              viewBox="0 0 10 6"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 6L0.669873 0H9.33013L5 6Z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Featured</th>
                    <th className="py-3 px-4">Deleted</th>
                    <th className="py-3 px-4">Created At</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-500">
                        No categories found
                      </td>
                    </tr>
                  ) : (
                    items.map((c) => (
                      <tr key={c.id} className="border-b">
                        <td className="py-4 px-4">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-gray-400">
                            ID: {c.id}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {c.description}
                        </td>
                        <td className="py-4 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Switch
                              key={`feat-${c.id}-${c.isFeatured}`}
                              label=""
                              color={c.isFeatured === "1" ? "green" : "gray"}
                              disabled={updatingIds.has(c.id)}
                              defaultChecked={c.isFeatured === "1"}
                              onChange={(checked) =>
                                handleToggleField(c.id, "isFeatured", checked)
                              }
                            />
                            <span
                              className={`text-sm font-medium ${
                                c.isFeatured === "1"
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {c.isFeatured === "1" ? "Yes" : "No"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Switch
                              key={`del-${c.id}-${c.isDeleted}`}
                              label=""
                              color={c.isDeleted === "0" ? "green" : "red"}
                              disabled={updatingIds.has(c.id)}
                              defaultChecked={c.isDeleted === "0"}
                              onChange={(checked) =>
                                handleToggleField(c.id, "isDeleted", !checked)
                              }
                            />
                            <span
                              className={`text-sm font-medium ${
                                c.isDeleted === "0"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {c.isDeleted === "0" ? "Active" : "Deleted"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {c.createdDate}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                            onClick={() => openEditModal(c.id)}
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
                            Edit
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
              Showing {items.length} of {totalElements} categories
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber <= 1}
                  aria-label="Previous page"
                  className={`w-9 h-9 flex items-center justify-center border rounded-lg ${
                    pageNumber <= 1
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
                        className={`transition-all ${
                          active
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
                  className={`w-9 h-9 flex items-center justify-center border rounded-lg ${
                    totalPages && pageNumber >= totalPages
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
      {/* Edit Category Modal */}
      <Modal
        isOpen={editOpen}
        onClose={closeEditModal}
        className="max-w-[700px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Category
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update category information.
            </p>
          </div>
          {editError && (
            <div className="px-2 mb-4">
              <Alert variant="error" title="Error" message={editError} />
            </div>
          )}
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleEditSave();
            }}
          >
            <div className="custom-scrollbar max-h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-2">
                  <Label>Name</Label>
                  <Input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Category name"
                  />
                </div>

                <div className="col-span-2 lg:col-span-2">
                  <Label>Description</Label>
                  <Input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={closeEditModal}
              >
                Close
              </Button>
              <Button size="sm" type="submit" disabled={editLoading}>
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
export default Category;
