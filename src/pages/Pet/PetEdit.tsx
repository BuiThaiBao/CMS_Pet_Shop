import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import Select from "../../components/form/Select";
import petApi, { UpdatePetPayload, PetImage } from "../../services/api/petApi";
import ImageUploadDropzone from "../../components/Product/ImageUploadDropzone";

export default function PetEdit() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState<string>("");
  const [animal, setAnimal] = useState<string>("");
  const [breed, setBreed] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [ageGroup, setAgeGroup] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [healthStatus, setHealthStatus] = useState<string>("");
  const [vaccinated, setVaccinated] = useState<boolean>(false);
  const [neutered, setNeutered] = useState<boolean>(false);
  const [isDeleted, setIsDeleted] = useState<string>("0");

  // Image upload state
  const [petImages, setPetImages] = useState<PetImage[]>([]);
  // Keep track of original images to calculate deletions
  const [originalImages, setOriginalImages] = useState<PetImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ageGroupOptions = [
    { value: "Young", label: "Young (< 1 year)" },
    { value: "Child", label: "Child (1-3 years)" },
    { value: "Adult", label: "Adult (3-7 years)" },
    { value: "Senior", label: "Senior (> 7 years)" },
  ];

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ];

  const animalOptions = [
    { value: "DOG", label: "Dog" },
    { value: "CAT", label: "Cat" },
    { value: "BIRD", label: "Bird" },
    { value: "RABBIT", label: "Rabbit" },
    { value: "OTHER", label: "Other" },
  ];

  const healthStatusOptions = [
    { value: "BAD", label: "Bad" },
    { value: "GOOD", label: "Good" },
  ];

  useEffect(() => {
    const loadPet = async () => {
      if (!id) {
        setError("Pet ID is missing");
        setLoadingData(false);
        return;
      }
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        setError("Invalid pet ID");
        setLoadingData(false);
        return;
      }
      setLoadingData(true);
      setError(null);
      try {
        const res = await petApi.getPetById(numericId);
        const data = res?.data?.result ?? res?.data;
        if (data) {
          setName(data.name || "");
          setAnimal(data.animal || "");
          setBreed(data.breed || "");
          setAge(data.age !== undefined && data.age !== null ? String(data.age) : "");
          setAgeGroup(data.ageGroup || "");
          setWeight(data.weight !== undefined && data.weight !== null ? String(data.weight) : "");
          setGender(data.gender || "");
          setDescription(data.description || "");
          setHealthStatus(data.healthStatus || "");
          const vaccinatedRaw = data.vaccinated;
          const neuteredRaw = data.neutered;
          setWeight(data.weight !== undefined && data.weight !== null ? String(data.weight) : "");
          setNeutered(
            neuteredRaw === true || neuteredRaw === 1 || neuteredRaw === "1"
          );
          setIsDeleted(data.isDeleted || "0");

          // Set images if available, sorting by position (null check just in case)
          // Handle potential different casing from API (snake_case vs camelCase)
          if (data.images && Array.isArray(data.images)) {
            const imgs = data.images.map((img: any) => ({
              id: img.id, // Important for tracking existing vs new
              imageUrl: img.imageUrl || img.image_url || img.url || "",
              publicId: img.publicId || img.public_id || String(Math.random()),
              isPrimary: !!(img.isPrimary || img.is_primary),
              imagePosition: Number(img.imagePosition || img.image_position || 0)
            }))
              .filter((img: any) => img.imageUrl) // Filter out invalid images
              .sort((a: any, b: any) => a.imagePosition - b.imagePosition);

            console.log("Loaded images:", imgs);
            setPetImages(imgs);
            setOriginalImages(imgs); // Store original state
          }
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load pet");
      } finally {
        setLoadingData(false);
      }
    };
    loadPet();
  }, [id]);

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAge(value);
    const num = Number(value);
    if (!value) {
      setAgeGroup("");
    } else if (num < 1) {
      setAgeGroup("Young");
    } else if (num >= 1 && num < 3) {
      setAgeGroup("Child");
    } else if (num >= 3 && num <= 7) {
      setAgeGroup("Adult");
    } else if (num > 7) {
      setAgeGroup("Senior");
    }
  };

  // ==================== Image Upload Logic ====================

  const handleImageUpload = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0) {
        return;
      }

      setUploadingImages(true);


      try {
        console.log(`Uploading ${files.length} images to Cloudinary...`);

        const CLOUDINARY_CLOUD_NAME =
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "di2a8fvuv";
        const CLOUDINARY_UPLOAD_PRESET =
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";

        if (!CLOUDINARY_UPLOAD_PRESET) {
          throw new Error(
            "Upload preset is not configured. Please set VITE_CLOUDINARY_UPLOAD_PRESET in your .env file."
          );
        }

        const uploadPromises = files.map((file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

          return fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              method: "POST",
              body: formData,
            }
          )
            .then((res) => {
              if (!res.ok) {
                return res.json().then((errorData) => {
                  throw new Error(
                    errorData.error?.message ||
                    `Cloudinary upload failed with status ${res.status}`
                  );
                });
              }
              return res.json();
            })
            .then((data) => {
              if (!data.secure_url || !data.public_id) {
                throw new Error(
                  "Invalid response from Cloudinary - missing secure_url or public_id"
                );
              }
              return {
                secure_url: data.secure_url,
                public_id: data.public_id,
              };
            });
        });

        const uploadResults = await Promise.all(uploadPromises);

        // Append new images.
        // If there were no images before, the first one is primary.
        const startPosition = petImages.length + 1;
        const newImages: PetImage[] = uploadResults.map(
          (
            result: { secure_url: string; public_id: string },
            index: number
          ) => ({
            imageUrl: result.secure_url,
            publicId: result.public_id,
            isPrimary: petImages.length === 0 && index === 0,
            imagePosition: startPosition + index,
          })
        );

        setPetImages((prev) => [...prev, ...newImages]);
        setMessage(`Successfully uploaded ${uploadResults.length} image(s)`);
      } catch (err: any) {
        console.error("Image upload exception:", err);
        setError(err.message || "Image upload failed");
      } finally {
        setUploadingImages(false);
      }
    },
    [petImages.length]
  );

  const removeImage = (publicId: string) => {
    setPetImages((prev) => prev.filter((img) => img.publicId !== publicId));
  };

  const setPrimaryImage = (publicId: string) => {
    setPetImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.publicId === publicId,
      }))
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      setError("Pet ID is missing");
      return;
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      setError("Invalid pet ID");
      return;
    }

    if (weight && Number(weight) <= 0) {
      setError("Weight must be greater than 0.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // ===============================
      // 1️⃣ XÁC ĐỊNH ẢNH BỊ XOÁ
      // ===============================
      const currentImageIds = new Set(
        petImages
          .map((img) => img.id)
          .filter((id): id is number => id !== undefined)
      );

      const deletedImageIds = originalImages
        .filter(
          (img) => img.id !== undefined && !currentImageIds.has(img.id)
        )
        .map((img) => img.id!);

      // ===============================
      // 2️⃣ LẤY ẢNH MỚI (KHÔNG CÓ ID)
      // ===============================
      const newImages = petImages
        .filter((img) => !img.id)
        .map((img, index) => ({
          imageUrl: img.imageUrl,
          publicId: img.publicId,
          isPrimary: img.isPrimary,
          imagePosition: index,
        }));

      // ===============================
      // 2.5️⃣ TÌM ẢNH PRIMARY (CÓ ID)
      // ===============================
      const primaryExistingImage = petImages.find((img) => img.id && img.isPrimary);
      const primaryImageId = primaryExistingImage?.id;

      // ===============================
      // 3️⃣ PAYLOAD UPDATE
      // ===============================
      const payload: UpdatePetPayload = {
        name,
        animal,
        breed,
        age: age ? Number(age) : undefined,
        ageGroup,
        weight: weight ? Number(weight) : undefined,
        gender,
        description,
        healthStatus,
        vaccinated: vaccinated ? "1" : "0",
        neutered: neutered ? "1" : "0",
        isDeleted,

        deletedImageIds,
        images: newImages, // ❗ chỉ gửi ảnh mới
        primaryImageId, // ❗ ID ảnh primary (nếu là ảnh đã có sẵn)
      };

      const res = await petApi.updatePet(numericId, payload);
      const data = res?.data;

      if (data?.success || data?.code === 1000) {
        setMessage("Update pet successfully");
        setTimeout(() => {
          navigate("/pet/list");
        }, 1200);
      } else {
        setError(data?.message || "Update failed");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update pet");
    } finally {
      setLoading(false);
    }
  };


  if (loadingData) {
    return (
      <>
        <PageMeta title="Edit Pet" description="Edit pet information" />
        <div className="p-6">
          <div className="flex h-[50vh] w-full items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-indigo-600 border-t-transparent"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Edit Pet" description="Edit pet information" />
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[26px] font-bold leading-[30px] text-dark dark:text-white">Edit Pet</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/pet/list")}
          >
            ← Back to List
          </Button>
        </div>

        <form onSubmit={submit} className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
          {error && (
            <div className="mb-3">
              <Alert variant="error" title="Error" message={error} />
            </div>
          )}
          {message && (
            <div className="mb-3">
              <Alert variant="success" title="Success" message={message} />
            </div>
          )}

          <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
            <div className="w-full xl:w-1/2">
              <label className="mb-2.5 block text-black dark:text-white">Pet Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-indigo-600 active:border-indigo-600 dark:border-form-strokedark dark:bg-form-input dark:focus:border-indigo-600"
                placeholder="Enter pet name"
              />
            </div>
            <div className="w-full xl:w-1/2">
              <label className="mb-2.5 block text-black dark:text-white">
                Animal Type
              </label>
              <Select
                options={animalOptions}
                value={animal}
                onChange={(val) => setAnimal(val)}
                placeholder="Select Animal"
                required
              />
            </div>
          </div>

          <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
            <div className="w-full xl:w-1/2">
              <label className="mb-2.5 block text-black dark:text-white">Breed</label>
              <input
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                required
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-indigo-600 active:border-indigo-600 dark:border-form-strokedark dark:bg-form-input dark:focus:border-indigo-600"
                placeholder="Enter breed"
              />
            </div>
            <div className="w-full xl:w-1/2">
              <label className="mb-2.5 block text-black dark:text-white">Age</label>
              <input
                type="number"
                value={age}
                onChange={handleAgeChange}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-indigo-600 active:border-indigo-600 dark:border-form-strokedark dark:bg-form-input dark:focus:border-indigo-600"
                placeholder="Enter age"
              />
            </div>
          </div>

          <div className="mb-4.5 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Age Group
              </label>
              <Select
                options={ageGroupOptions}
                value={ageGroup}
                onChange={(val) => setAgeGroup(val)}
                placeholder="Select Age Group"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white">Weight (kg)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={weight}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || Number(val) >= 0) {
                    setWeight(val);
                  }
                }}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-indigo-600 active:border-indigo-600 dark:border-form-strokedark dark:bg-form-input dark:focus:border-indigo-600"
                placeholder="Enter weight"
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white">Gender</label>
              <Select
                options={genderOptions}
                value={gender}
                onChange={(val) => setGender(val)}
                placeholder="Select Gender"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2.5 block text-black dark:text-white">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-indigo-600 active:border-indigo-600 dark:border-form-strokedark dark:bg-form-input dark:focus:border-indigo-600 h-32"
              placeholder="Description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="mb-2.5 block text-black dark:text-white">
                Health Status
              </label>
              <Select
                options={healthStatusOptions}
                value={healthStatus}
                onChange={(val) => setHealthStatus(val)}
                placeholder="Select Health Status"
              />
            </div>
            <div className="flex items-center gap-6 mt-6 md:mt-8">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={vaccinated}
                  onChange={(e) => setVaccinated(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                Vaccinated
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={neutered}
                  onChange={(e) => setNeutered(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                Neutered
              </label>
            </div>
          </div>

          <div className="form-grid-2 mt-4">
            <div className="w-full xl:w-1/2">
              <label className="mb-2.5 block text-black dark:text-white">Status</label>
              <select
                value={isDeleted}
                onChange={(e) => setIsDeleted(e.target.value)}
                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-indigo-600 active:border-indigo-600 dark:border-form-strokedark dark:bg-form-input dark:focus:border-indigo-600"
              >
                <option value="0">False</option>
                <option value="1">True</option>
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div className="mt-4">
            <label className="mb-2.5 block text-black dark:text-white">
              Pet Images
            </label>
            <ImageUploadDropzone
              onImagesDrop={handleImageUpload}
              isLoading={uploadingImages}
            />

            {/* Image Preview List */}
            {petImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {petImages.map((img, index) => (
                  <div
                    key={img.publicId}
                    className={`relative overflow-hidden rounded-lg border ${img.isPrimary ? 'border-indigo-600 ring-2 ring-indigo-600/50' : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    <img
                      src={img.imageUrl}
                      alt={`Pet ${index + 1}`}
                      className="h-32 w-full object-cover"
                    />
                    <div className="absolute top-1 right-1">
                      <button
                        type="button"
                        onClick={() => removeImage(img.publicId)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 shadow-md transition-all"
                        title="Remove Image"
                      >
                        <span className="text-lg leading-none mb-0.5">&times;</span>
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-center backdrop-blur-sm">
                      {img.isPrimary ? (
                        <span className="text-xs font-semibold text-white">
                          Primary
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(img.publicId)}
                          className="text-xs text-white hover:underline hover:text-indigo-200 transition-colors"
                        >
                          Set Primary
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-4">
            <Button
              size="md"
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              size="md"
              variant="outline"
              type="button"
              onClick={() => navigate("/pet/list")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}


