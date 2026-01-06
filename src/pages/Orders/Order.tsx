import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
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
  WAITING_PAYMENT: [],
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
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      setError(err?.message || t('messages.loadError'));
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
      alert(err?.message || t('messages.updateError'));
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
      <PageMeta title={t('order.title')} description={t('order.orderList')} />

      <div className="p-4">
        <h1 className="text-xl font-semibold">{t('order.title')}</h1>

        {error && (
          <div className="my-4">
            <Alert variant="error" title={t('common.error')} message={error} />
          </div>
        )}

        {/* ================= FILTER ================= */}
        <div className="my-4 flex items-center gap-4">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('order.searchOrderCode')}
            className="w-64 px-3 py-2 border rounded-lg"
          />

          <Select
            value={status}
            options={[
              { value: "", label: t('order.allStatus') },
              { value: "WAITING_PAYMENT", label: t('order.waitingPayment') },
              { value: "PROCESSING", label: t('order.processing') },
              { value: "SHIPPED", label: t('order.shipped') },
             { value: "DELIVERED", label: t('order.delivered') },
              { value: "COMPLETED", label: t('order.completed') },
              { value: "CANCELLED", label: t('order.cancelled') },
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
              {t('order.selectToUpdate')}
            </span>
          )}

          {selectedIds.length > 0 && !selectedBaseStatus && (
            <span className="text-sm text-red-600">
              {t('order.mustSameStatus')}
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
              ({selectedIds.length} {t('order.selected')})
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
                <th className="px-4 py-3">{t('order.orderCode')}</th>
                <th className="px-4 py-3">{t('order.customer')}</th>
                <th className="px-4 py-3">{t('order.total')}</th>
                <th className="px-4 py-3">{t('common.status')}</th>
                <th className="px-4 py-3">{t('common.createdAt')}</th>
                <th className="px-4 py-3">{t('common.actions')}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    {t('order.noOrders')}
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
                        {t(`order.${o.status.toLowerCase()}`)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {o.createdDate}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() => navigate(`/orders/${o.id}`)}
                        className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        {t('order.viewDetails')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ================= PAGINATION ================= */}
        {totalPages > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {t('common.showing')} {Math.min((pageNumber - 1) * pageSize + 1, totalElements)} {t('common.to')}{" "}
              {Math.min(pageNumber * pageSize, totalElements)} {t('common.of')} {totalElements} {t('order.orders')}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPageNumber(pageNumber - 1)}
                disabled={pageNumber === 1}
                className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {t('common.previous')}
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= pageNumber - 1 && page <= pageNumber + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setPageNumber(page)}
                      className={`px-3 py-2 border rounded-lg text-sm ${
                        page === pageNumber
                          ? "bg-blue-600 text-white border-blue-600"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === pageNumber - 2 ||
                  page === pageNumber + 2
                ) {
                  return (
                    <span key={page} className="px-2 text-gray-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => setPageNumber(pageNumber + 1)}
                disabled={pageNumber === totalPages}
                className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
