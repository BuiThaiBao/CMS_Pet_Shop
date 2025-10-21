import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Alert from "../ui/alert/Alert";
import { getToken } from "../../services/api/tokenStorage";

type ImageEditData = {
  id: number;
  productId: number;
  imageUrl: string;
  position: number;
  isPrimary: number;
  isDeleted: string;
};

interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: ImageEditData | null;
  onUpdateSuccess?: () => void;
}

export default function ImageEditModal({
  isOpen,
  onClose,
  image,
  onUpdateSuccess,
}: ImageEditModalProps) {
  const [position, setPosition] = useState<number>(0);
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (image) {
      setPosition(image.position);
      setIsPrimary(image.isPrimary === 1);
      setIsDeleted(image.isDeleted === "1");
      setError(null);
      setSuccess(null);
    }
  }, [image]);

  const handleUpdate = async () => {
    if (!image) return;

    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(
        `http://localhost:8080/api/v1/images/${image.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            imageUrl: image.imageUrl,
            position: position,
            isPrimary: isPrimary ? 1 : 0,
            isDeleted: isDeleted ? "1" : "0",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update image");
      }

      setSuccess("Image updated successfully!");

      if (onUpdateSuccess) {
        setTimeout(() => {
          onUpdateSuccess();
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error("Update error:", err);
      setError(err?.message || "Failed to update image");
    } finally {
      setUpdating(false);
    }
  };

  if (!image) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl mx-4">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Edit Image Properties
        </h2>

        {error && (
          <div className="mb-4">
            <Alert variant="error" title="Error" message={error} />
          </div>
        )}

        {success && (
          <div className="mb-4">
            <Alert variant="success" title="Success" message={success} />
          </div>
        )}

        {/* Image Preview */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image Preview
          </label>
          <div className="border rounded-lg overflow-hidden bg-gray-50">
            <img
              src={image.imageUrl}
              alt="Preview"
              className="w-full h-48 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "https://via.placeholder.com/400x300?text=No+Image";
              }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">Image ID: {image.id}</p>
        </div>

        {/* Position */}
        <div className="mb-6">
          <label
            htmlFor="position"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Position (Display Order)
          </label>
          <input
            type="number"
            id="position"
            min="0"
            value={position}
            onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
            disabled={updating}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-gray-500">
            Lower numbers appear first
          </p>
        </div>

        {/* Is Primary */}
        <div className="mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              disabled={updating}
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Set as Primary Image
            </span>
          </label>
          <p className="mt-1 ml-8 text-xs text-gray-500">
            Primary image will be displayed as the main product image
          </p>
        </div>

        {/* Is Deleted */}
        <div className="mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isDeleted}
              onChange={(e) => setIsDeleted(e.target.checked)}
              disabled={updating}
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 disabled:opacity-50"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Mark as Deleted
            </span>
          </label>
          <p className="mt-1 ml-8 text-xs text-gray-500">
            Deleted images won't be displayed in product listings
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={updating}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={updating}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updating ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                  Updating...
                </>
              ) : (
                "Update Image"
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
