import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import petApi from "../../services/api/petApi";

interface PetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId: number | null;
}

type PetDetail = {
  id: number;
  name?: string;
  animal?: string;
  breed?: string;
  age?: number;
  ageGroup?: string;
  size?: string;
  gender?: string;
  description?: string;
  healthStatus?: string;
  vaccinated?: string | number | boolean;
  neutered?: string | number | boolean;
  isDeleted?: string;
  createdDate?: string;
  updatedDate?: string;
  // Images are flexible because we don't know exact backend shape
  images?: Array<{
    id?: number;
    imageUrl: string;
    isPrimary?: boolean | number | string;
    imagePosition?: number;
  }>;
  [key: string]: any;
};

export default function PetDetailModal({
  isOpen,
  onClose,
  petId,
}: PetDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && petId !== null && petId !== undefined) {
      const numericId = typeof petId === 'string' ? parseInt(petId, 10) : petId;
      if (!isNaN(numericId)) {
        fetchPetDetail(numericId);
      }
    }
  }, [isOpen, petId]);

  async function fetchPetDetail(id: number) {
    if (!id || isNaN(id)) {
      setError("Invalid pet ID");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await petApi.getPetById(id);
      const data = (res?.data?.result ?? res?.data) as PetDetail | null;
      setPet(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to fetch pet details");
    } finally {
      setLoading(false);
    }
  }

  const normalizeBoolean = (value: any): string => {
    if (value === true || value === "1" || value === 1) return "Yes";
    if (value === false || value === "0" || value === 0) return "No";
    return value ? String(value) : "N/A";
  };

  const imageList: Array<{
    id?: number;
    imageUrl: string;
    isPrimary?: boolean | number | string;
    imagePosition?: number;
  }> =
    (pet?.images as any[]) ||
    (pet?.petImages as any[]) ||
    (pet?.petImage as any[]) ||
    [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl mx-4">
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
        ) : pet ? (
          <div>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {pet.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>ID: {pet.id}</span>
                {pet.animal && <span>Animal: {pet.animal}</span>}
                {pet.breed && <span>Breed: {pet.breed}</span>}
                {pet.age !== undefined && pet.age !== null && (
                  <span>Age: {pet.age}</span>
                )}
                {pet.ageGroup && <span>Age Group: {pet.ageGroup}</span>}
                {pet.size && <span>Size: {pet.size}</span>}
                {pet.gender && <span>Gender: {pet.gender}</span>}
                {pet.isDeleted === "1" && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                    Deleted
                  </span>
                )}
              </div>
            </div>

            {/* Description & health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {pet.description || "No description"}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Health</h3>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Health Status: </span>
                  {pet.healthStatus || "N/A"}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-semibold">Vaccinated: </span>
                  {normalizeBoolean(pet.vaccinated)}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-semibold">Neutered: </span>
                  {normalizeBoolean(pet.neutered)}
                </p>
              </div>
            </div>

            {/* Images */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Images</h3>
              {imageList && imageList.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageList.map((img, index) => (
                    <div
                      key={img.id ?? index}
                      className="border rounded-lg overflow-hidden bg-gray-50"
                    >
                      <div className="relative">
                        {img.isPrimary && (
                          <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </div>
                        )}
                        <img
                          src={img.imageUrl}
                          alt={pet.name || "Pet image"}
                          className="w-full h-40 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "https://via.placeholder.com/300x300?text=No+Image";
                          }}
                        />
                      </div>
                      <div className="p-2 text-xs text-gray-500 flex justify-between">
                        {img.id && <span>ID: {img.id}</span>}
                        {img.imagePosition !== undefined && (
                          <span>Pos: {img.imagePosition}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">No images available</p>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Created:</span>{" "}
                {pet.createdDate || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Updated:</span>{" "}
                {pet.updatedDate || "N/A"}
              </p>
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
  );
}


