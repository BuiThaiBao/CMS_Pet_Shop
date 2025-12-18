import { useEffect, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import Select from "../../components/form/Select";
import orderApi from "../../services/api/orderApi";
import ModalPortal from "../../components/common/ModalPorTal";

/* ================= TYPES ================= */

export type OrderStatus =
  | "WAITING_PAYMENT"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "COMPLETED"
  | "REFUNDED";

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
  fullName: string; // ✅ từ BE
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

/* ================= PAGE ================= */

export default function OrderPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("");

  // 🔍 Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  /* ================= FETCH ================= */

  useEffect(() => {
    if (isDetailOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDetailOpen]);

  useEffect(() => {
    fetchOrders();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, query, status]);

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

      // backend page = 0-based
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

  /* ================= STATUS STYLE ================= */

  const STATUS_STYLE: Record<OrderStatus, string> = {
    WAITING_PAYMENT: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-indigo-100 text-indigo-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    REFUNDED: "bg-gray-200 text-gray-700",
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
            options={[
              { value: "", label: "All Status" },
              { value: "WAITING_PAYMENT", label: "Waiting Payment" },
              { value: "PROCESSING", label: "Processing" },
              { value: "SHIPPED", label: "Shipped" },
              { value: "DELIVERED", label: "Delivered" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
            defaultValue={status}
            onChange={(v) => {
              setStatus(v);
              setPageNumber(1);
            }}
          />
        </div>

        {/* ================= TABLE ================= */}
        <div className="overflow-x-auto bg-white border rounded-lg">
          <table className="w-full text-left">
            <thead className="border-b text-sm text-gray-500">
              <tr>
                <th className="px-4 py-3">Order Code</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3">Action</th>
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

                    <td className="px-4 py-4">
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setIsDetailOpen(true);
                        }}
                        className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                      >
                        View detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {items.length} of {totalElements} orders
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber <= 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            <span className="text-sm">
              {pageNumber} / {totalPages}
            </span>

            <button
              onClick={() =>
                pageNumber < totalPages && setPageNumber(pageNumber + 1)
              }
              disabled={pageNumber >= totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ================= ORDER DETAIL MODAL ================= */}
      {isDetailOpen && selectedOrder && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
            <div className="bg-white rounded-lg w-full max-w-3xl p-6 relative">
              {/* CLOSE */}
              <button
                onClick={() => setIsDetailOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl"
              >
                ✕
              </button>

              {/* HEADER */}
              <h2 className="text-lg font-semibold mb-4">
                Order Detail – {selectedOrder.orderCode}
              </h2>

              {/* INFO */}
              <div className="mb-4 text-sm space-y-1">
                <div>
                  <b>Customer:</b> {selectedOrder.fullName}
                </div>
                <div>
                  <b>Address:</b> {selectedOrder.shippingAddress}
                </div>
                <div>
                  <b>Status:</b> {selectedOrder.status}
                </div>
              </div>

              {/* ITEMS */}
              <div className="border rounded-lg divide-y">
                {selectedOrder.orderItems.map((item) => (
                  <div key={item.orderItemId} className="flex gap-3 p-3">
                    <img
                      src={item.imageUrl}
                      className="w-14 h-14 rounded object-cover border"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-500">
                        x{item.quantity} • {item.unitPrice.toLocaleString()} đ
                      </div>
                    </div>
                    <div className="font-semibold">
                      {item.totalPrice.toLocaleString()} đ
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTAL */}
              <div className="mt-4 text-right text-sm">
                <div>
                  Shipping: {selectedOrder.shippingAmount.toLocaleString()} đ
                </div>
                <div className="font-semibold text-base">
                  Total: {selectedOrder.totalAmount.toLocaleString()} đ
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
