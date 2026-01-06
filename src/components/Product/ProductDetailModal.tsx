import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import productApi from "../../services/api/productApi";
import ImageModal from "../common/ImageModal";

type ProductImage = {
  id: number;
  productId: number;
  imageUrl: string;
  position?: number;
  isPrimary?: number;
  isDeleted?: string;
  createdDate?: string;
  updatedDate?: string;
};


type ProductVariant = {
  id: number;
  productId: number;
  productImageId?: number;
  variantName: string;
  weight?: number;
  price: number;
  stockQuantity: number;
  soldQuantity: number;
  isDeleted: string;
  createdDate?: string;
  updatedDate?: string;
};

type ProductDetail = {
  id: number;
  categoryName?: string;
  name: string;
  shortDescription?: string;
  description?: string;
  animal?: string;
  brand?: string;
  stockQuantity?: number;
  soldQuantity?: number;
  isDeleted?: string;
  isFeatured?: string;
  createdDate?: string;
  updatedDate?: string;
  productImage?: ProductImage[];
  productVariant?: ProductVariant[];
};

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
  onOpenUpload?: (productId: number) => void;
}

export default function ProductDetailModal({
  isOpen,
  onClose,
  productId,
  onOpenUpload,
}: ProductDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);


  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetail(productId);
    }
  }, [isOpen, productId]);

  async function fetchProductDetail(id: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await productApi.getById(id);
      const data = res?.data?.result ?? res?.data;
      setProduct(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  };





  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl mx-4">
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          ) : product ? (
            <div>
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {product.name}
                </h2>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                  <span>ID: {product.id}</span>
                  {product.categoryName && (
                    <span>Category: {product.categoryName}</span>
                  )}
                  {product.animal && <span>Animal: {product.animal}</span>}
                  {product.brand && <span>Brand: {product.brand}</span>}
                  {product.isFeatured === "1" && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      Featured
                    </span>
                  )}
                  {product.isDeleted === "1" && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                      Deleted
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Mô tả</h3>
                <p className="text-sm text-gray-700 mb-2">
                  {product.shortDescription || "Không có mô tả ngắn"}
                </p>
                {product.description && (
                  <p className="text-sm text-gray-600">{product.description}</p>
                )}
              </div>

              {/* Product Images */}
              <div className="mb-6">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold">Hình ảnh sản phẩm</h3>
                </div>
                {product.productImage && product.productImage.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {product.productImage.map((img) => (
                      <div
                        key={img.id}
                        className="border rounded-lg overflow-hidden bg-gray-50 group hover:shadow-lg transition-shadow relative"
                      >


                        {/* Primary Badge */}
                        {img.isPrimary === 1 && (
                          <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            Chính
                          </div>
                        )}

                        {/* Position Badge */}
                        {img.position !== undefined && (
                          <div className="absolute bottom-14 left-2 z-10 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                            Vị trí: {img.position}
                          </div>
                        )}

                        <div
                          className="relative overflow-hidden cursor-pointer"
                          onClick={() => handleImageClick(img.imageUrl)}
                        >
                          <img
                            src={img.imageUrl}
                            alt={`Product ${product.name}`}
                            className="w-full h-40 object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "https://via.placeholder.com/300x300?text=No+Image";
                            }}
                          />
                          {/* Hover overlay with zoom icon */}
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none"></div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <svg
                              className="w-10 h-10 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="p-2 text-xs text-gray-500">
                          ID: {img.id}
                          {img.isDeleted === "1" && (
                            <span className="ml-2 text-red-600 font-semibold">
                              (Deleted)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      No images available
                    </p>
                    {onOpenUpload && (
                      <button
                        onClick={() => onOpenUpload(product.id)}
                        className="mt-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Upload First Image
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Product Variants */}
              <div className="mb-6">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold">Biến thể sản phẩm (Chỉ xem)</h3>
                </div>
                {product.productVariant && product.productVariant.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border">
                      <thead className="bg-gray-50">
                        <tr className="text-sm text-gray-600">
                          <th className="py-3 px-4 border-b">ID</th>

                          <th className="py-3 px-4 border-b">Tên biến thể</th>
                          <th className="py-3 px-4 border-b">Khối lượng (g)</th>
                          <th className="py-3 px-4 border-b">Giá</th>
                          <th className="py-3 px-4 border-b">Tồn kho</th>
                          <th className="py-3 px-4 border-b">Đã bán</th>
                          <th className="py-3 px-4 border-b">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.productVariant.map((variant) => (
                          <tr key={variant.id} className="border-b">
                            <td className="py-3 px-4 text-sm">{variant.id}</td>

                            <td className="py-3 px-4 text-sm font-medium">
                              {variant.variantName}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {variant.weight ? `${variant.weight}g` : "N/A"}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-indigo-600">
                              {formatCurrency(variant.price)}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {variant.stockQuantity}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {variant.soldQuantity}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  variant.isDeleted === "1"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {variant.isDeleted === "1" ? "Đã xóa" : "Hoạt động"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      No variants available
                    </p>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Created:</span>{" "}
                    {product.createdDate || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Updated:</span>{" "}
                    {product.updatedDate || "N/A"}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Image Zoom Modal - Outside main modal */}
      {/* Image Zoom Modal - Outside main modal */}
      {isImageModalOpen && selectedImage && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={handleCloseImageModal}
          imageUrl={selectedImage}
          alt={product?.name || "Product Image"}
        />
      )}


    </>
  );
}
