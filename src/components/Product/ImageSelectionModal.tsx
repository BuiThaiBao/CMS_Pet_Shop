import { useState } from "react";
import { ProductImage } from "../../pages/Product/ProductCreateAllInOne";

interface ImageSelectionModalProps {
  images: ProductImage[];
  selectedUrls: string[];
  onConfirm: (selectedUrls: string[]) => void;
  onCancel: () => void;
}

export default function ImageSelectionModal({
  images,
  selectedUrls: initialSelectedUrls,
  onConfirm,
  onCancel,
}: ImageSelectionModalProps) {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(
    new Set(initialSelectedUrls)
  );

  const toggleImage = (imageUrl: string) => {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(imageUrl)) {
      newSelected.delete(imageUrl);
    } else {
      newSelected.add(imageUrl);
    }
    setSelectedUrls(newSelected);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedUrls));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Select Images for Variant</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 font-bold text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {images.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No images available
            </p>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Select one or more images for this variant (click to toggle)
              </p>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {images.map((image) => {
                  const isSelected = selectedUrls.has(image.imageUrl);
                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => toggleImage(image.imageUrl)}
                      className={`relative group rounded-lg overflow-hidden border-4 transition ${
                        isSelected
                          ? "border-indigo-600 ring-2 ring-indigo-400"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={image.imageUrl}
                        alt="product"
                        className="w-full h-24 object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedUrls.size === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm ({selectedUrls.size})
          </button>
        </div>
      </div>
    </div>
  );
}
