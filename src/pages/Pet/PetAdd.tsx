import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import petApi, { CreatePetPayload, PetImage } from "../../services/api/petApi";
import Select from "../../components/form/Select";
import ImageUploadDropzone from "../../components/Product/ImageUploadDropzone";

export default function PetAdd() {
  const navigate = useNavigate();

  // Pet Info
  const [name, setName] = useState<string>("");
  const [animal, setAnimal] = useState<string>("");
  const [breed, setBreed] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [ageGroup, setAgeGroup] = useState<string>("");

  // Tự động cập nhật ageGroup khi nhập tuổi
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
  const [size, setSize] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [healthStatus, setHealthStatus] = useState<string>("");
  const [vaccinated, setVaccinated] = useState<boolean>(false);
  const [neutered, setNeutered] = useState<boolean>(false);

  // Image upload state
  const [petImages, setPetImages] = useState<PetImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  // Removed unused uploadError state

  // Form submission
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Options
  const ageGroupOptions = [
    { value: "Young", label: "Young (< 1 year)" },
    { value: "Child", label: "Child (1-3 years)" },
    { value: "Adult", label: "Adult (3-7 years)" },
    { value: "Senior", label: "Senior (> 7 years)" },
  ];

  const sizeOptions = [
    { value: "Small", label: "Small" },
    { value: "Medium", label: "Medium" },
    { value: "Big", label: "Big" },
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

        const newImages: PetImage[] = uploadResults.map(
          (
            result: { secure_url: string; public_id: string },
            index: number
          ) => ({
            imageUrl: result.secure_url,
            publicId: result.public_id,
            isPrimary: petImages.length === 0 && index === 0,
            imagePosition: petImages.length + index + 1,
          })
        );

        setPetImages((prev) => [...prev, ...newImages]);
        setMessage(`Successfully uploaded ${uploadResults.length} image(s)`);
      } catch (err: any) {
        console.error("Image upload exception:", err);

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

  // ==================== Submit Logic ====================

  const handleSubmit = async () => {
    if (!name || !animal || !breed || !age || !ageGroup || !size || !gender) {
      setError("Please fill in all required fields.");
      return;
    }

    if (petImages.length === 0) {
      setError("Please upload at least one image.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const payload: CreatePetPayload = {
        name,
        animal,
        breed,
        age: Number(age),
        ageGroup,
        size,
        gender,
        description,
        healthStatus,
        vaccinated: vaccinated ? "1" : "0",
        neutered: neutered ? "1" : "0",
        images: petImages,
      };

      const res = await petApi.createFullPet(payload);
      if (res.data && res.data.success) {
        setMessage("Pet created successfully!");
        setTimeout(() => {
          navigate("/pet/list");
        }, 1500);
      } else {
        setError(res.data?.message || "Failed to create pet.");
      }
    } catch (err: any) {
      console.error("Create pet error:", err);
      setError(err?.response?.data?.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Form validation: only enable Create button when all required fields filled
  const isFormValid = Boolean(
    name && name.trim() &&
      animal &&
      breed && breed.trim() &&
      age !== "" &&
      ageGroup &&
      size &&
      gender &&
      petImages.length > 0
  );

  return (
    <>
      <PageMeta
        title="Add New Pet | Pet Shop CMS"
        description="Add a new pet to the store"
      />
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Add New Pet
          </h2>
          <nav>
            <ol className="flex items-center gap-2">
              <li>
                <a className="font-medium" href="/">
                  Dashboard /
                </a>
              </li>
              <li className="font-medium text-primary">Add Pet</li>
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-9">
          <div className="flex flex-col gap-9">
            {/* Form */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Pet Information
                </h3>
              </div>
              <div className="p-6.5">
                {message && (
                  <Alert
                    variant="success"
                    title="Success"
                    message={message}
                  />
                )}
                {error && (
                  <Alert
                    variant="error"
                    title="Error"
                    message={error}
                  />
                )}

                <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                  <div className="w-full xl:w-1/2">
                    <label className="mb-2.5 block text-black dark:text-white">
                      Pet Name <span className="text-meta-1">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter pet name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                  </div>

                  <div className="w-full xl:w-1/2">
                    <label className="mb-2.5 block text-black dark:text-white">
                      Animal Type <span className="text-meta-1">*</span>
                    </label>
                    <Select
                      options={animalOptions}
                      value={animal}
                      onChange={(val) => setAnimal(val)}
                      placeholder="Select animal"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                  <div className="w-full xl:w-1/2">
                    <label className="mb-2.5 block text-black dark:text-white">
                      Breed <span className="text-meta-1">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter breed"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                  </div>

                  <div className="w-full xl:w-1/2">
                    <label className="mb-2.5 block text-black dark:text-white">
                      Age <span className="text-meta-1">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Enter age"
                      value={age}
                      onChange={handleAgeChange}
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                  </div>
                </div>

                <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                  <div className="w-full xl:w-1/3">
                    <label className="mb-2.5 block text-black dark:text-white">
                      Age Group <span className="text-meta-1">*</span>
                    </label>
                    <Select
                      options={ageGroupOptions}
                      value={ageGroup}
                      onChange={(val) => setAgeGroup(val)}
                      placeholder="Select Age Group"
                      required
                    />
                  </div>
                  <div className="w-full xl:w-1/3">
                    <label className="mb-2.5 block text-black dark:text-white">
                      Size <span className="text-meta-1">*</span>
                    </label>
                    <Select
                      options={sizeOptions}
                      value={size}
                      onChange={(val) => setSize(val)}
                      placeholder="Select Size"
                      required
                    />
                  </div>
                  <div className="w-full xl:w-1/3">
                    <label className="mb-2.5 block text-black dark:text-white">
                      Gender <span className="text-meta-1">*</span>
                    </label>
                    <Select
                      options={genderOptions}
                      value={gender}
                      onChange={(val) => setGender(val)}
                      placeholder="Select Gender"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-2.5 block text-black dark:text-white">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Detailed description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  ></textarea>
                </div>

                <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                  <div className="w-full xl:w-1/2">
                      <label className="mb-2.5 block text-black dark:text-white">
                        Health Status
                      </label>
                      <Select
                        options={healthStatusOptions}
                        value={healthStatus}
                        onChange={(val) => setHealthStatus(val)}
                        placeholder="Select health status"
                      />
                    </div>
                </div>

                <div className="mb-6 flex flex-col gap-6 xl:flex-row">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="vaccinated"
                      checked={vaccinated}
                      onChange={(e) => setVaccinated(e.target.checked)}
                      className="h-5 w-5"
                    />
                    <label
                      htmlFor="vaccinated"
                      className="text-black dark:text-white"
                    >
                      Vaccinated
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="neutered"
                      checked={neutered}
                      onChange={(e) => setNeutered(e.target.checked)}
                      className="h-5 w-5"
                    />
                    <label
                      htmlFor="neutered"
                      className="text-black dark:text-white"
                    >
                      Neutered
                    </label>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="mb-6">
                  <label className="mb-2.5 block text-black dark:text-white">
                    Upload Pet Images <span className="text-meta-1">*</span>
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
                          className={`relative overflow-hidden rounded border ${
                            img.isPrimary
                              ? "border-primary ring-2 ring-primary ring-opacity-50"
                              : "border-stroke dark:border-strokedark"
                          }`}
                        >
                          <img
                            src={img.imageUrl}
                            alt={`Pet ${index + 1}`}
                            className="h-32 w-full object-cover"
                          />
                          <div className="absolute top-1 right-1 flex gap-1">
                            <button
                              type="button"
                              onClick={() => removeImage(img.publicId)}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white hover:bg-opacity-90"
                              title="Remove"
                            >
                              &times;
                            </button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1 text-center">
                            {img.isPrimary ? (
                              <span className="text-xs font-medium text-white">
                                Primary
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPrimaryImage(img.publicId)}
                                className="text-xs text-white hover:underline"
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

                <div className="flex justify-end gap-4.5">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/pet/list")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!isFormValid || loading || uploadingImages}
                  >
                    {loading ? "Creating..." : "Create Pet"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
