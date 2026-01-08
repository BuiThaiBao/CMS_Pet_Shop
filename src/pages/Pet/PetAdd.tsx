import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import petApi, { CreatePetPayload, PetImage } from "../../services/api/petApi";
import Select from "../../components/form/Select";
import ImageUploadDropzone from "../../components/Product/ImageUploadDropzone";

export default function PetAdd() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Pet Info
  const [name, setName] = useState<string>("");
  const [animal, setAnimal] = useState<string>("");
  const [breed, setBreed] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [ageGroup, setAgeGroup] = useState<string>("");

  // Tự động cập nhật ageGroup khi nhập tuổi (Giữ logic để tính toán nếu cần, nhưng không hiển thị input)
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (Number(value) < 0) return; // Prevent negative values
    setAge(value);
    const num = Number(value);
    // Vẫn tính toán ageGroup ngầm định nếu backend cần, hoặc cứ để ""
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
  const [weight, setWeight] = useState<string>("");
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
  // Removed ageGroupOptions user requested to remove the field

  const genderOptions = [
    { value: "Đực", label: "Đực" },
    { value: "Cái", label: "Cái" },
  ];

  const animalOptions = [
    { value: "Chó", label: "Chó" },
    { value: "Mèo", label: "Mèo" },
    { value: "Chim", label: "Chim" },
    { value: "Thỏ", label: "Thỏ" },
    { value: "Khác", label: "Khác" },
  ];

  const healthStatusOptions = [
    { value: "Tệ", label: "Tệ" },
    { value: "Tốt", label: "Tốt" },
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
    if (!name || !animal || !breed || !age || !weight || !gender) {
      setError("Please fill in all required fields.");
      return;
    }

    if (Number(weight) <= 0) {
      setError("Weight must be greater than 0.");
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
        weight: Number(weight),
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
      weight !== "" &&
      gender &&
      petImages.length > 0
  );

  return (
    <>
      <PageMeta
        title={t('pet.addPet')}
        description={t('pet.addPet')}
      />
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            {t('pet.addPet')}
          </h2>
          <nav>
            <ol className="flex items-center gap-2">
              <li>
                <a className="font-medium" href="/">
                  Trang chủ /
                </a>
              </li>
              <li className="font-medium text-primary">Thêm thú cưng</li>
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-9">
          <div className="flex flex-col gap-9">
            {/* Form */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  {t('pet.petInformation')}
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
                      {t('pet.name')} <span className="text-meta-1">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t('pet.enterPetName')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                  </div>

                  <div className="w-full xl:w-1/2">
                    <label className="mb-2.5 block text-black dark:text-white">
                      {t('pet.animal')} <span className="text-meta-1">*</span>
                    </label>
                    <Select
                      options={animalOptions}
                      value={animal}
                      onChange={(val) => setAnimal(val)}
                      placeholder={t('pet.selectAnimal')}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                  <div className="w-full xl:w-1/2">
                    <label className="mb-2.5 block text-black dark:text-white">
                      {t('pet.breed')} <span className="text-meta-1">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t('pet.enterBreed')}
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                  </div>

                  <div className="w-full xl:w-1/2">
                    <label className="mb-2.5 block text-black dark:text-white">
                      {t('pet.age')} <span className="text-meta-1">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder={t('pet.enterAge')}
                      value={age}
                      onChange={handleAgeChange}
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                  </div>
                </div>

                <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                  <div className="w-full xl:w-1/2">
                    <label className="mb-2.5 block text-black dark:text-white">
                      {t('pet.weight')} <span className="text-meta-1">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder={t('pet.enterWeight')}
                      value={weight}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || Number(val) >= 0) {
                          setWeight(val);
                        }
                      }}
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                  </div>
                  <div className="w-full xl:w-1/2">
                    <label className="mb-2.5 block text-black dark:text-white">
                      {t('pet.gender')} <span className="text-meta-1">*</span>
                    </label>
                    <Select
                      options={genderOptions}
                      value={gender}
                      onChange={(val) => setGender(val)}
                      placeholder={t('pet.selectGender')}
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-2.5 block text-black dark:text-white">
                    {t('common.description')}<span className="text-meta-1">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder={t('pet.detailedDescription')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    required
                  ></textarea>
                </div>

                <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                  <div className="w-full xl:w-1/2">
                      <label className="mb-2.5 block text-black dark:text-white">
                        {t('pet.healthStatus')} <span className="text-meta-1">*</span>
                      </label>
                      <Select
                        options={healthStatusOptions}
                        value={healthStatus}
                        onChange={(val) => setHealthStatus(val)}
                        placeholder={t('pet.selectHealthStatus')}
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
                      {t('pet.vaccinated')}
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
                      {t('pet.neutered')}
                    </label>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="mb-6">
                  <label className="mb-2.5 block text-black dark:text-white">
                    {t('product.uploadProductImages')} <span className="text-meta-1">*</span>
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
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!isFormValid || loading || uploadingImages}
                  >
                    {loading ? t('pet.creating') : t('pet.createPet')}
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
