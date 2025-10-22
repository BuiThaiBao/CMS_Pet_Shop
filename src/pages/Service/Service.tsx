import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import Switch from "../../components/form/switch/Switch";
import serviceApi from "../../services/api/serviceApi";
import Button from "../../components/ui/button/Button";

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
};

function Service() {
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
      setError(err?.message || "Failed to fetch services");
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
      setError(err?.message || "Failed to update service");
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

  return (
    <>
      <PageMeta title="Service" description="Service list" />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Service List</h1>
            <p className="mt-2 text-sm text-gray-600">Manage services</p>
          </div>
          <Button
            onClick={() => navigate("/service/add")}
            size="md"
            className="bg-indigo-600"
          >
            + Add Service
          </Button>
        </div>
        <div className="mt-4 bg-white rounded-lg border">
          {error && (
            <div className="p-4">
              <Alert variant="error" title="Error" message={error} />
            </div>
          )}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search by name..."
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
                        Name
                        {sortDirection === "asc" && <span>↑</span>}
                        {sortDirection === "desc" && <span>↓</span>}
                      </button>
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Duration (min)
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-gray-500"
                      >
                        No services found
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
                              className={`text-sm font-medium ${
                                s.isActive === "1"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {s.isActive === "1" ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                            onClick={() => navigate(`/service/edit/${s.id}`)}
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
              Showing {items.length} of {totalElements} services
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

export default Service;
