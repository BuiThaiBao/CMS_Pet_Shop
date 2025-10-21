import { Modal } from "../ui/modal";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

export default function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  alt = "Image",
}: ImageModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-7xl mx-4">
      <div className="p-4">
        <div className="relative">
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                "https://via.placeholder.com/800x600?text=Image+Not+Found";
            }}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
