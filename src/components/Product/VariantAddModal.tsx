import { useState } from "react";
import { Modal } from "../ui/modal";
import variantApi from "../../services/api/variantApi";

type ProductImage = {
  id: number;
  imageUrl: string;
  isPrimary?: number;
};

interface VariantAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productImages?: ProductImage[];
  onAddSuccess?: () => void;
}

export default function VariantAddModal({
  isOpen,
  onClose,
  productId,
  productImages,
  onAddSuccess,
}: VariantAddModalProps) {
  const [variantName, setVariantName] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">(50000);
  const [stockQuantity, setStockQuantity] = useState<number | "">(50);
  const [selectedImageId, setSelectedImageId] = useState<number | "">(
    productImages && productImages.length > 0 ? productImages[0].id : ""
  );
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    if (!adding) {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setVariantName("");
    setWeight("");
    setPrice("");
    setStockQuantity("");
    setSelectedImageId(
      productImages && productImages.length > 0 ? productImages[0].id : ""
    );
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    if (!stockQuantity || stockQuantity < 0) {
      setError("Stock quantity cannot be negative");
      return;
    }

    if (!selectedImageId) {
      setError("Please select a product image");
      return;
    }

    setAdding(true);

    try {
      const payload = {
        productId,
        productImageId: Number(selectedImageId),
        variantName: variantName.trim(),
        weight: weight ? Number(weight) : 10,
        price: Number(price),
        stockQuantity: Number(stockQuantity),
      };

      const response = await variantApi.create(payload);
      const data = response?.data;

      if (data?.success || data?.code === 1000) {
        setSuccess(true);
        setTimeout(() => {
          if (onAddSuccess) {
            onAddSuccess();
          }
          handleClose();
        }, 1500);
      } else {
        setError(data?.message || "Failed to add variant");
      }
    } catch (err: any) {
      console.error("Add variant error:", err);
      setError(err?.message || "An error occurred while adding variant");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md mx-4">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Add New Variant</h2>
          <button
            onClick={handleClose}
            disabled={adding}
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
              Variant added successfully!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product ID (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product ID
            </label>
            <input
              type="text"
              value={productId}
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
              placeholder="e.g., Test Variant"
              disabled={adding}
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
              placeholder="10"
              min="0"
              step="0.1"
              disabled={adding}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Default: 10g if not specified
            </p>
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
              placeholder="50000"
              min="0"
              step="1000"
              disabled={adding}
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
              placeholder="50"
              min="0"
              disabled={adding}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
              required
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
                  disabled={adding}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
                  required
                >
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={adding}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {adding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Adding...</span>
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Add Variant</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
