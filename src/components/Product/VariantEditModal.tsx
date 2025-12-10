import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import variantApi from "../../services/api/variantApi";

type ProductImage = {
  id: number;
  imageUrl: string;
  isPrimary?: number;
};

type VariantEditData = {
  id: number;
  productId: number;
  imageUrl?: string[]; // ✅ đổi sang mảng
  productImageIds?: number[]; // ✅ đổi sang mảng
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
  productImages = [],
  onUpdateSuccess,
}: VariantEditModalProps) {
  const [variantName, setVariantName] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [stockQuantity, setStockQuantity] = useState<number | "">("");

  // ✅ MULTI IMAGE STATE
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);

  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ✅ Load dữ liệu khi mở modal
  useEffect(() => {
    if (variant && isOpen && productImages?.length) {
      setVariantName(variant.variantName);
      setWeight(variant.weight || "");
      setPrice(variant.price);
      setStockQuantity(variant.stockQuantity);

      // ✅ MAP imageUrl -> imageId
      const selectedIds = productImages
        .filter((img) => variant.imageUrl?.includes(img.imageUrl))
        .map((img) => img.id);

      setSelectedImageIds(selectedIds);
    }
  }, [variant, isOpen, productImages]);

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

    // ✅ VALIDATION
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

    if (selectedImageIds.length === 0) {
      setError("Please select at least one product image");
      return;
    }

    setUpdating(true);

    try {
      // ✅ PAYLOAD MỚI (imageIds)
      const payload = {
        productId: variant.productId,
        variantName: variantName.trim(),
        imageIds: selectedImageIds,
        weight: weight !== "" ? Number(weight) : null,
        price: Number(price),
        stockQuantity: Number(stockQuantity),
        isDeleted: variant.isDeleted,
      };

      const response = await variantApi.update(variant.id, payload);
      const data = response?.data;

      if (data?.success || data?.code === 1000) {
        setSuccess(true);
        setTimeout(() => {
          onUpdateSuccess?.();
          handleClose();
        }, 1500);
      } else {
        setError(data?.message || "Failed to update variant");
      }
    } catch (err: any) {
      console.error("Update variant error:", err);
      setError(err?.message || "An error occurred while updating variant");
    } finally {
      setUpdating(false);
    }
  };

  if (!variant) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md mx-4">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Edit Variant</h2>

        {error && <p className="mb-3 text-red-600">{error}</p>}
        {success && <p className="mb-3 text-green-600">Update successful!</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Variant Name */}
          <div>
            <label className="block text-sm font-medium">Variant Name</label>
            <input
              type="text"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium">Weight (g)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) =>
                setWeight(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* ✅ MULTI IMAGE SELECT */}
          {/* ✅ IMAGE PICK GRID */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Product Images (Click to select multiple)
            </label>

            {productImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {productImages.map((img) => {
                  const isSelected = selectedImageIds.includes(img.id);

                  return (
                    <div
                      key={img.id}
                      onClick={() => {
                        setSelectedImageIds(
                          (prev) =>
                            isSelected
                              ? prev.filter((id) => id !== img.id) // ❌ Bỏ chọn
                              : [...prev, img.id] // ✅ Thêm chọn
                        );
                      }}
                      className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition
              ${
                isSelected
                  ? "border-indigo-600 ring-2 ring-indigo-400"
                  : "border-gray-300"
              }
            `}
                    >
                      <img
                        src={img.imageUrl}
                        alt="product"
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/150";
                        }}
                      />

                      {/* ✅ CHECK ICON */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}

                      {/* ✅ PRIMARY BADGE */}
                      {img.isPrimary === 1 && (
                        <div className="absolute bottom-1 left-1 bg-yellow-500 text-white text-xs px-1 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-300 rounded text-sm">
                No images available. Please upload images first.
              </div>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium">Stock Quantity</label>
            <input
              type="number"
              value={stockQuantity}
              onChange={(e) =>
                setStockQuantity(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={updating}
              className="flex-1 border rounded py-2"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={updating}
              className="flex-1 bg-indigo-600 text-white rounded py-2"
            >
              {updating ? "Updating..." : "Update Variant"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
