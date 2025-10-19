import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import axios from "axios";
import { authService } from "../../services/authService";

type CategoryItem = {
  id: number;
  name: string;
  description?: string;
  isFeatured?: string;
  isDeleted?: string;
  createdDate?: string;
  updatedDate?: string;
};

export default function Category() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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

  const API_URL = "http://localhost:8080/api/v1";

  // Đồng bộ filterFeatured vào URL để khi refresh/back vẫn giữ được lựa chọn
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (filterFeatured && filterFeatured !== "all") {
        url.searchParams.set("feature", filterFeatured);
      } else {
        url.searchParams.delete("feature");
      }
      window.history.replaceState({}, "", url.toString());
    } catch (e) {
      // Bỏ qua trong môi trường SSR hoặc nơi không có đối tượng URL
    }
  }, [filterFeatured]);

  // Hàm tải dữ liệu trung tâm: tự động chạy khi thay đổi trang, kích thước trang, từ khóa, sắp xếp và trạng thái bộ lọc
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      if (filterFeatured === "1" || filterFeatured === "0") {
        await fetchFeatured(pageNumber, pageSize, filterFeatured as "1" | "0");
      } else {
        await fetchCategories(pageNumber, pageSize, query);
      }
    };
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize, query, sortDirection, filterFeatured]);

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
      const token = authService.getCurrentToken();
      const params = {
        pageNumber: page,
        size,
        search: q ?? undefined,
      } as Record<string, any>;
      if (sortDirection) {
        params.sort = `name,${sortDirection}`;
      }
      const res = await axios.get(`${API_URL}/categories`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        signal: controller.signal,
      });
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
      const token = authService.getCurrentToken();

      const form = new URLSearchParams();
      form.append("pageNumber", String(page));
      form.append("size", String(size));
      form.append("isFeature", isFeature);
      if (sortDirection) form.append("sort", `name,${sortDirection}`);
      if (query) form.append("search", query);

      const res = await axios.post(
        `${API_URL}/categories/feature`,
        form.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        }
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

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterPanelOpen(false);
                          setPageNumber(1);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-gray-500 border-b">
                    <th className="py-3 px-4 w-8">
                      <input type="checkbox" />
                    </th>
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
                    <th className="py-3 px-4">Created At</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        No categories found
                      </td>
                    </tr>
                  ) : (
                    items.map((c) => (
                      <tr key={c.id} className="border-b">
                        <td className="py-4 px-4">
                          <input type="checkbox" />
                        </td>
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
                          {c.isFeatured === "1" ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              Yes
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              No
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {c.createdDate}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            className="text-sm text-brand-500"
                            onClick={() => navigate(`/category/edit/${c.id}`)}
                          >
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
    </>
  );
}
