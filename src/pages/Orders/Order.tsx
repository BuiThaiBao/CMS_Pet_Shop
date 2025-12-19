import { useEffect, useMemo, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import Select from "../../components/form/Select";
import orderApi from "../../services/api/orderApi";

/* ================= TYPES ================= */

export type OrderStatus =
  | "WAITING_PAYMENT"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

type OrderItem = {
  orderItemId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
};

type Order = {
  id: number;
  orderCode: string;
  fullName: string;
  totalAmount: number;
  shippingAmount: number;
  discountPercent: number;
  shippingAddress: string;
  note?: string;
  status: OrderStatus;
  createdDate: string;
  updatedDate?: string;
  orderItems: OrderItem[];
};

/* ================= STATUS TRANSITION ================= */

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  WAITING_PAYMENT: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const BULK_BUTTON_STYLE: Record<OrderStatus, string> = {
  WAITING_PAYMENT: "bg-blue-600 hover:bg-blue-700",
  PROCESSING: "bg-indigo-600 hover:bg-indigo-700",
  SHIPPED: "bg-emerald-600 hover:bg-emerald-700",
  DELIVERED: "bg-green-600 hover:bg-green-700",
  COMPLETED: "bg-gray-500",
  CANCELLED: "bg-red-600 hover:bg-red-700",
};

/* ================= PAGE ================= */

export default function OrderPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("");

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  /* ================= EFFECT ================= */

  useEffect(() => {
    fetchOrders();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, query, status]);

  /* ================= FETCH ================= */

  async function fetchOrders() {
    setLoading(true);
    setError(null);

    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await orderApi.list(
        {
          pageNumber,
          size: pageSize,
          orderCode: query || undefined,
          status: status || undefined,
        },
        { signal: controller.signal }
      );

      const result = res?.data?.result;

      if (!result) {
        setItems([]);
        setTotalPages(0);
        setTotalElements(0);
        return;
      }

      setItems(result.content ?? []);
      setTotalPages(result.totalPages ?? 0);
      setTotalElements(result.totalElements ?? 0);

      if (typeof result.number === "number") {
        setPageNumber(result.number + 1);
      }
    } catch (err: any) {
      if (err?.name === "CanceledError") return;
      setError(err?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }

  /* ================= DEBOUNCE SEARCH ================= */

  useEffect(() => {
    const t = setTimeout(() => {
      setPageNumber(1);
      setQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ================= BULK LOGIC ================= */

  const selectedBaseStatus = useMemo<OrderStatus | null>(() => {
    if (selectedIds.length === 0) return null;

    const selectedOrders = items.filter((o) => selectedIds.includes(o.id));

    const firstStatus = selectedOrders[0]?.status;
    const sameStatus = selectedOrders.every((o) => o.status === firstStatus);

    return sameStatus ? firstStatus : null;
  }, [items, selectedIds]);

  const bulkActionStatuses = useMemo<OrderStatus[]>(() => {
    if (!selectedBaseStatus) return [];
    return VALID_TRANSITIONS[selectedBaseStatus];
  }, [selectedBaseStatus]);

  /* ================= BULK UPDATE ================= */

  async function handleBulkUpdate(newStatus: OrderStatus) {
    if (selectedIds.length === 0) return;

    try {
      setUpdating(true);

      await orderApi.updateStatus({
        orderUpdateList: items
          .filter((o) => selectedIds.includes(o.id))
          .map((o) => ({
            id: o.id,
            orderCode: o.orderCode,
            orderStatus: newStatus,
          })),
      });

      setSelectedIds([]);
      fetchOrders();
    } catch (err: any) {
      alert(err?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  }

  /* ================= STATUS STYLE ================= */

  const STATUS_STYLE: Record<OrderStatus, string> = {
    WAITING_PAYMENT: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-indigo-100 text-indigo-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <>
      <PageMeta title="Order Management" description="Manage orders" />

      <div className="p-4">
        <h1 className="text-xl font-semibold">Order Management</h1>

        {error && (
          <div className="my-4">
            <Alert variant="error" title="Error" message={error} />
          </div>
        )}

        {/* ================= FILTER ================= */}
        <div className="my-4 flex items-center gap-4">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search order code..."
            className="w-64 px-3 py-2 border rounded-lg"
          />

          <Select
            value={status}
            options={[
              { value: "", label: "All Status" },
              { value: "WAITING_PAYMENT", label: "Waiting Payment" },
              { value: "PROCESSING", label: "Processing" },
              { value: "SHIPPED", label: "Shipped" },
              { value: "DELIVERED", label: "Delivered" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
            onChange={(v) => {
              setStatus(v);
              setPageNumber(1);
            }}
          />
        </div>

        {/* ================= BULK ACTION BAR ================= */}
        <div className="my-4 flex items-center gap-3 flex-wrap justify-end">
          {selectedIds.length === 0 && (
            <span className="text-sm text-gray-400">
              Select orders to update status
            </span>
          )}

          {selectedIds.length > 0 && !selectedBaseStatus && (
            <span className="text-sm text-red-600">
              Selected orders must have the same status
            </span>
          )}

          {bulkActionStatuses.map((s) => (
            <button
              key={s}
              disabled={updating}
              onClick={() => handleBulkUpdate(s)}
              className={`px-4 py-2 rounded text-white text-sm ${BULK_BUTTON_STYLE[s]} disabled:opacity-50`}
            >
              {s.replace("_", " ")}
            </button>
          ))}

          {selectedIds.length > 0 && bulkActionStatuses.length > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              ({selectedIds.length} selected)
            </span>
          )}
        </div>

        {/* ================= TABLE ================= */}
        <div className="overflow-x-auto bg-white border rounded-lg">
          <table className="w-full text-left">
            <thead className="border-b text-sm text-gray-500">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      items.length > 0 && selectedIds.length === items.length
                    }
                    onChange={(e) =>
                      setSelectedIds(
                        e.target.checked ? items.map((o) => o.id) : []
                      )
                    }
                  />
                </th>
                <th className="px-4 py-3">Order Code</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created At</th>
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
                    No orders found
                  </td>
                </tr>
              ) : (
                items.map((o) => (
                  <tr key={o.id} className="border-b">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(o.id)}
                        onChange={(e) =>
                          setSelectedIds((prev) =>
                            e.target.checked
                              ? [...prev, o.id]
                              : prev.filter((id) => id !== o.id)
                          )
                        }
                      />
                    </td>

                    <td className="px-4 py-4 font-medium">{o.orderCode}</td>

                    <td className="px-4 py-4">
                      <div className="font-medium">{o.fullName}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {o.shippingAddress}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-medium">
                      {o.totalAmount.toLocaleString()} đ
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          STATUS_STYLE[o.status]
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {o.createdDate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
