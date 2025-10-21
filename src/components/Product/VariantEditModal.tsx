import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import { getToken } from "../../services/api/tokenStorage";

type ProductImage = {
  id: number;
  imageUrl: string;
  isPrimary?: number;
};

type VariantEditData = {
  id: number;
  productId: number;
  productImageId?: number;
  variantName: string;
  weight?: number;
  price: number;
  stockQuantity: number;
  soldQuantity: number;
  isDeleted: string;
};

interface VariantEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: VariantEditData | null;
  productImages?: ProductImage[];
  onUpdateSuccess?: () => void;
}

export default function VariantEditModal({
  isOpen,
  onClose,
  variant,
  productImages,
  onUpdateSuccess,
}: VariantEditModalProps) {
  const [variantName, setVariantName] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [stockQuantity, setStockQuantity] = useState<number | "">("");
  const [selectedImageId, setSelectedImageId] = useState<number | "">("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (variant && isOpen) {
      setVariantName(variant.variantName);
      setWeight(variant.weight || "");
      setPrice(variant.price);
      setStockQuantity(variant.stockQuantity);
      setSelectedImageId(variant.productImageId || "");
    }
  }, [variant, isOpen]);

  const handleClose = () => {
    if (!updating) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant) return;

    setError(null);

    // Validation
    if (!variantName.trim()) {
      setError("Variant name is required");
      return;
    }

    if (!price || price <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    if (stockQuantity === "" || Number(stockQuantity) < 0) {
      setError("Stock quantity cannot be negative");
      return;
    }

    if (!selectedImageId) {
      setError("Please select a product image");
      return;
    }

    setUpdating(true);

    try {
      const token = getToken();
      const payload = {
        variantName: variantName.trim(),
        productImageId: Number(selectedImageId),
        weight: weight ? Number(weight) : null,
        price: Number(price),
        stockQuantity: Number(stockQuantity),
        isDeleted: variant.isDeleted, // Keep current deleted status
      };

      const response = await fetch(
        `http://localhost:8080/api/v1/variants/${variant.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok && data.code === 1000) {
        setSuccess(true);
        setTimeout(() => {
          if (onUpdateSuccess) {
            onUpdateSuccess();
          }
          handleClose();
        }, 1500);
      } else {
        setError(data.message || "Failed to update variant");
      }
    } catch (err: any) {
      console.error("Update variant error:", err);
      setError(err.message || "An error occurred while updating variant");
    } finally {
      setUpdating(false);
    }
  };

  if (!variant) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md mx-4">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Edit Variant</h2>
          <button
            onClick={handleClose}
            disabled={updating}
            className="text-gray-400 hover:text-gray-500 transition-colors disabled:opacity-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-green-800">
              Variant updated successfully!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Variant ID (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant ID
            </label>
            <input
              type="text"
              value={variant.id}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Variant Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              disabled={updating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (grams)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) =>
                setWeight(e.target.value ? Number(e.target.value) : "")
              }
              min="0"
              step="0.1"
              disabled={updating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
            />
          </div>

          {/* Product Image Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image <span className="text-red-500">*</span>
            </label>
            {productImages && productImages.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedImageId}
                  onChange={(e) =>
                    setSelectedImageId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  disabled={updating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
                  required
                >
                  <option value="">Select an image</option>
                  {productImages.map((img) => (
                    <option key={img.id} value={img.id}>
                      Image ID: {img.id}
                      {img.isPrimary === 1 ? " (Primary)" : ""}
                    </option>
                  ))}
                </select>
                {selectedImageId && (
                  <div className="mt-2">
                    <img
                      src={
                        productImages.find((img) => img.id === selectedImageId)
                          ?.imageUrl
                      }
                      alt="Selected variant"
                      className="w-full h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://via.placeholder.com/300x300?text=No+Image";
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ No images available. Please upload images first.
                </p>
              </div>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (VND) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value ? Number(e.target.value) : "")
              }
              min="0"
              step="1000"
              disabled={updating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Stock Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={stockQuantity}
              onChange={(e) =>
                setStockQuantity(e.target.value ? Number(e.target.value) : "")
              }
              min="0"
              disabled={updating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Sold Quantity (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sold Quantity
            </label>
            <input
              type="text"
              value={variant.soldQuantity}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={updating}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Update Variant</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
