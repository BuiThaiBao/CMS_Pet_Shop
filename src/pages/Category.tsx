import { useEffect, useState, useRef } from "react";
import PageMeta from "../components/common/PageMeta";
import axios from "axios";
import { authService } from "../services/authService";

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

  const API_URL = "http://localhost:8080/api/v1";

  useEffect(() => {
    fetchCategories(pageNumber, pageSize, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize, query, sortDirection]);

  async function fetchCategories(page: number, size: number, q?: string) {
    setLoading(true);
    setError(null);
    try {
      // cancel previous request
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch (e) {
          /* ignore */
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
      // debug request params in console to help troubleshooting
      // remove or guard in production
      // eslint-disable-next-line no-console
      console.debug("fetchCategories -> params", params);

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
        // Normalize server page number to client 1-based pageNumber.
        // Many Spring backends are 0-based; some APIs may return 1-based.
        const serverPageRaw =
          typeof data.number === "number"
            ? data.number
            : (data.pageable?.pageNumber as number | undefined);
        const serverSize = data.size ?? data.pageable?.pageSize ?? size;

        // Decide resolvedPage (client-facing, 1-based):
        let resolvedPage = page; // default to requested page
        if (typeof serverPageRaw === "number") {
          if (serverPageRaw === page - 1) {
            // server is 0-based
            resolvedPage = serverPageRaw + 1;
          } else if (serverPageRaw === page) {
            // server is 1-based
            resolvedPage = serverPageRaw;
          } else {
            // fallback: if server returned 0 and we requested 1, assume 0-based
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
      // Axios when aborted by AbortController uses code 'ERR_CANCELED'
      const code = err?.code as string | undefined;
      if (code === "ERR_CANCELED" || err?.name === "CanceledError") {
        // request was cancelled, ignore silently
        return;
      }
      console.error(err);
      setError(err?.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
      // clear current controller
      abortRef.current = null;
    }
  }

  function goToPage(p: number) {
    if (p < 1 || (totalPages && p > totalPages)) return;
    setPageNumber(p);
  }

  // Debounce search input: update `query` 300ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      // when search changes, reset to page 1
      setPageNumber(1);
      setQuery(searchInput.trim());
    }, 150);
    return () => clearTimeout(t);
  }, [searchInput]);

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
          {error && <div className="p-4 text-sm text-red-600">{error}</div>}
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">
                Products List
              </label>
              <div className="relative">
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
                  className="w-full pl-11 pr-10 py-3 rounded-lg border focus:outline-none focus:ring"
                />

                {/* loading spinner inside input */}
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
                          <button className="text-sm text-brand-500">
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

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Page size:</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border px-2 py-1 rounded"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <button
                onClick={() => goToPage(pageNumber - 1)}
                disabled={pageNumber <= 1}
                className="px-3 py-1 border rounded"
              >
                Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.max(totalPages, 0) }).map(
                  (_, idx) => {
                    const p = idx + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        className={`px-2 py-1 rounded ${
                          p === pageNumber
                            ? "bg-brand-500 text-white"
                            : "border"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() => goToPage(pageNumber + 1)}
                disabled={totalPages ? pageNumber >= totalPages : false}
                className="px-3 py-1 border rounded"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
