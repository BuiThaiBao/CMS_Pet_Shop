import { useState } from "react";
import { Modal } from "../ui/modal";
import Alert from "../ui/alert/Alert";
import imageApi from "../../services/api/imageApi";

interface ProductImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
  onUploadSuccess?: () => void;
}

type UploadedImage = {
  id: number;
  productId: number;
  imageUrl: string;
  position: number;
  isPrimary: number;
  isDeleted: string;
  createdDate: string;
  updatedDate: string;
};

export default function ProductImageUploadModal({
  isOpen,
  onClose,
  productId,
  onUploadSuccess,
}: ProductImageUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...fileArray]);

    // Create previews
    const newPreviews = fileArray.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]); // Clean up
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    if (!productId) {
      setError("Product ID is required");
      return;
    }

    if (selectedFiles.length === 0) {
      setError("Please select at least one image");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadedImages([]);

    try {
      // Create positions array
      const positions = selectedFiles.map((_, index) => index + 1);

      const data = await imageApi.upload(productId, selectedFiles, positions);
      const results = data.result || [];

      // Set uploaded images
      setUploadedImages(Array.isArray(results) ? results : [results]);
      setSuccess(`Successfully uploaded ${selectedFiles.length} image(s)!`);

      // Clear selections
      setSelectedFiles([]);
      previews.forEach((preview) => URL.revokeObjectURL(preview));
      setPreviews([]);

      // Callback to refresh parent
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err?.message || "Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up previews
    previews.forEach((preview) => URL.revokeObjectURL(preview));
    setSelectedFiles([]);
    setPreviews([]);
    setError(null);
    setSuccess(null);
    setUploadedImages([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-3xl mx-4">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Upload Product Images
        </h2>

        {productId && (
          <p className="text-sm text-gray-600 mb-4">
            Product ID: <span className="font-semibold">{productId}</span>
          </p>
        )}

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

        {/* File Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Images
          </label>
          <p className="text-xs text-gray-500 mb-2">
            💡 Images will be numbered automatically (1, 2, 3...). Position
            determines display order.
          </p>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-10 h-10 mb-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF (MAX. 2MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Preview Grid */}
        {previews.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Selected Images ({previews.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  {/* Position Badge */}
                  <div className="absolute top-1 left-1 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10">
                    {index + 1}
                  </div>
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {selectedFiles[index]?.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Images Display */}
        {uploadedImages.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Successfully Uploaded
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {uploadedImages.map((img) => (
                <div key={img.id} className="border rounded-lg overflow-hidden">
                  <img
                    src={img.imageUrl}
                    alt={`Uploaded ${img.id}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2 bg-gray-50">
                    <p className="text-xs text-gray-600">ID: {img.id}</p>
                    <p className="text-xs text-gray-600">
                      Position: {img.position}
                    </p>
                    {img.isPrimary === 1 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Close
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
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
                Uploading...
              </>
            ) : (
              "Upload Images"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
