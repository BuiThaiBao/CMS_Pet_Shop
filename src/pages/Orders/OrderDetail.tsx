import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import orderApi from "../../services/api/orderApi";
import { OrderStatus } from "./Order";
import Button from "../../components/ui/button/Button";

/* ================= TYPES ================= */

type OrderDetailItem = {
  orderId: number;
  orderCode: string;
  status: string;
  shippingAmount: number;
  totalAmount: number;
  shippingAddress: string;
  // Address details from address relationship
  addressId?: number;
  contactName?: string;
  phone?: string;
  detailAddress?: string;
  ward?: string;
  state?: string;
  city?: string;
  orderDate: string;
  orderItemId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productName: string;
  variantId: number;
  variantPrice: number;
  stockQuantity: number;
  imageUrl?: string;
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

const BUTTON_STYLE: Record<OrderStatus, string> = {
  WAITING_PAYMENT: "bg-blue-600 hover:bg-blue-700",
  PROCESSING: "bg-indigo-600 hover:bg-indigo-700",
  SHIPPED: "bg-emerald-600 hover:bg-emerald-700",
  DELIVERED: "bg-green-600 hover:bg-green-700",
  COMPLETED: "bg-gray-500",
  CANCELLED: "bg-red-600 hover:bg-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  WAITING_PAYMENT: "Chờ thanh toán",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đã giao cho vận chuyển",
  DELIVERED: "Đã giao hàng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

/* ================= PAGE ================= */

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [orderDetails, setOrderDetails] = useState<OrderDetailItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchOrderDetail() {
    setLoading(true);
    setError(null);

    try {
      const res = await orderApi.getDetail(Number(id));
      const result = res?.data?.result;

      if (!result || result.length === 0) {
        setError("Không tìm thấy đơn hàng");
        return;
      }

      setOrderDetails(result);
    } catch (err: any) {
      setError(err?.message || "Lỗi khi tải chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  }

  // Get order header info from first item
  const orderInfo = orderDetails[0];

  const STATUS_STYLE: Record<string, string> = {
    WAITING_PAYMENT: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-indigo-100 text-indigo-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  // Calculate subtotal (sum of all items)
  const subtotal = orderDetails.reduce((sum, item) => sum + item.totalPrice, 0);

  // Get available status transitions
  const availableStatuses = useMemo<OrderStatus[]>(() => {
    if (!orderInfo) return [];
    return VALID_TRANSITIONS[orderInfo.status as OrderStatus] || [];
  }, [orderInfo]);

  // Handle status update
  async function handleStatusUpdate(newStatus: OrderStatus) {
    if (!orderInfo) return;

    try {
      setUpdating(true);

      await orderApi.updateStatus({
        orderUpdateList: [
          {
            id: orderInfo.orderId,
            orderCode: orderInfo.orderCode,
            orderStatus: newStatus,
          },
        ],
      });

      // Refresh order details
      fetchOrderDetail();
    } catch (err: any) {
      alert(err?.message || "Cập nhật thất bại");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageMeta title="Chi tiết đơn hàng" description="Xem chi tiết đơn hàng" />
        <div className="p-4">
          <div className="text-center py-8">Đang tải...</div>
        </div>
      </>
    );
  }

  if (error || !orderInfo) {
    return (
      <>
        <PageMeta title="Chi tiết đơn hàng" description="Xem chi tiết đơn hàng" />
        <div className="p-4">
          <Alert variant="error" title="Lỗi" message={error || "Không tìm thấy đơn hàng"} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/orders")}
          >
            ← Quay lại đơn hàng
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={`Đơn hàng ${orderInfo.orderCode}`} description="Xem chi tiết đơn hàng" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Chi tiết đơn hàng</h1>
           <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/orders")}
          >
            ← Quay lại đơn hàng
          </Button>
        </div>

        {/* Status Transition Actions */}
        {availableStatuses.length > 0 && (
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600">Thay đổi trạng thái:</span>
            {availableStatuses.map((status) => (
              <button
                key={status}
                disabled={updating}
                onClick={() => handleStatusUpdate(status)}
                className={`px-4 py-2 rounded text-white text-sm ${BUTTON_STYLE[status]} disabled:opacity-50`}
              >
                {STATUS_LABELS[status] || status}
              </button>
            ))}
          </div>
        )}

        {/* Order Information Card */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Thông tin đơn hàng</h2>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Mã đơn hàng</span>
                  <p className="font-medium">{orderInfo.orderCode}</p>
                </div>

                <div>
                  <span className="text-sm text-gray-500">Trạng thái</span>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                        STATUS_STYLE[orderInfo.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {STATUS_LABELS[orderInfo.status] || orderInfo.status}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-500">Ngày đặt hàng</span>
                  <p className="font-medium">{orderInfo.orderDate}</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Thông tin vận chuyển</h2>
              
              <div className="space-y-3">
                {orderInfo.contactName ? (
                  // Display structured address from address relationship
                  <>
                    <div>
                      <span className="text-sm text-gray-500">Người nhận</span>
                      <p className="font-medium">{orderInfo.contactName}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-500">Số điện thoại</span>
                      <p className="font-medium">{orderInfo.phone}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-500">Địa chỉ giao hàng</span>
                      <p className="font-medium">
                        {orderInfo.detailAddress}<br/>
                        {orderInfo.ward}, {orderInfo.state}<br/>
                        {orderInfo.city}
                      </p>
                    </div>
                  </>
                ) : (
                  // Fallback to shippingAddress string for old orders
                  <div>
                    <span className="text-sm text-gray-500">Địa chỉ giao hàng</span>
                    <p className="font-medium">{orderInfo.shippingAddress}</p>
                  </div>
                )}

                <div>
                  <span className="text-sm text-gray-500">Phí vận chuyển</span>
                  <p className="font-medium">{orderInfo.shippingAmount.toLocaleString()} VND</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="bg-white border rounded-lg overflow-hidden mb-6">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold">Sản phẩm đơn hàng</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Sản phẩm</th>
                  <th className="px-4 py-3 text-left">Chi tiết loại sản phẩm</th>
                  <th className="px-4 py-3 text-right">Đơn giá</th>
                  <th className="px-4 py-3 text-center">Số lượng</th>
                  <th className="px-4 py-3 text-right">Tổng</th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.map((item) => (
                  <tr key={item.orderItemId} className="border-b">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.productName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <p className="text-gray-600">ID loại sản phẩm: {item.variantId}</p>
                        <p className="text-gray-600">Tồn kho: {item.stockQuantity}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      {item.unitPrice.toLocaleString()} VND
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-block px-3 py-1 rounded">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold">
                      {item.totalPrice.toLocaleString()} VND
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>
          
          <div className="max-w-md ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tạm tính</span>
              <span className="font-medium">{subtotal.toLocaleString()} VND</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Vận chuyển</span>
              <span className="font-medium">{orderInfo.shippingAmount.toLocaleString()} VND</span>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold">Tổng cộng</span>
                <span className="font-bold text-lg text-blue-600">
                  {orderInfo.totalAmount.toLocaleString()} VND
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
