import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import productApi, {
  CreateProductAllInOnePayload,
} from "../../services/api/productApi";
import categoryApi from "../../services/api/categoryApi";
import Select from "../../components/form/Select";
import ImageUploadDropzone from "../../components/Product/ImageUploadDropzone";

// Types
export type ProductImage = {
  id?: string; // Temporary ID for local state
  imageUrl: string;
  publicId: string; // Public ID from Cloudinary
  isPrimary?: boolean;
  position?: number;
};

export type Variant = {
  id: string;
  variantName: string;
  price: string;
  weight: string;
  stockQuantity: string;
  associatedImageUrls: string[];
};

export default function ProductCreateAllInOne() {
  const navigate = useNavigate();

  // General info
  const [categoryId, setCategoryId] = useState<string>("");
  const [catOptions, setCatOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const categoryName = (() => {
    const option = catOptions.find((opt) => opt.value === categoryId);
    return option ? option.label : "";
  })();
  const [name, setName] = useState<string>("");
  const [nameChecking, setNameChecking] = useState(false);
  const [nameExists, setNameExists] = useState<boolean | null>(null);
  const nameCheckTimeout = useRef<number | null>(null);

  const [shortDescription, setShortDescription] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [featured, setFeatured] = useState<boolean>(false);
  const [animal, setAnimal] = useState<string>("");
  const [brand, setBrand] = useState<string>("");

  const [catLoading, setCatLoading] = useState<boolean>(false);
  const catAbortRef = useRef<AbortController | null>(null);

  // Image upload state
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Variants
  const [variants, setVariants] = useState<Variant[]>([]);

  // Form submission
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step tracking
  const [currentStep, setCurrentStep] = useState<
    "info" | "variants" | "review"
  >("info");

  // ==================== Utility Functions ====================

  const reset = () => {
    setCategoryId("");
    setName("");
    setShortDescription("");
    setDescription("");
    setAnimal("");
    setBrand("");
    setFeatured(false);
    setProductImages([]);
    setVariants([]);
    setUploadError(null);
    setMessage(null);
    setError(null);
    setCurrentStep("info");
  };

  // CHECK PRODUCT NAME EXISTENCE
  const checkProductName = useCallback((value: string) => {
    if (!value.trim()) {
      setNameExists(null);
      return;
    }

    // debounce 500ms
    if (nameCheckTimeout.current) {
      clearTimeout(nameCheckTimeout.current);
    }

    nameCheckTimeout.current = setTimeout(async () => {
      try {
        setNameChecking(true);
        const res = await productApi.checkProductExists(value.trim());
        const exists = res?.data?.result === true;
        setNameExists(exists);
      } catch (err) {
        console.error("Check name error", err);
        setNameExists(null);
      } finally {
        setNameChecking(false);
      }
    }, 500);
  }, []);

  // ==================== Image Upload Logic ====================

  const handleImageUpload = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0) {
        setUploadError("No files selected");
        return;
      }

      setUploadingImages(true);
      setUploadError(null);

      try {
        console.log(`Uploading ${files.length} images to Cloudinary...`);

        // Cloudinary configuration
        // IMPORTANT: You need to create an unsigned upload preset in Cloudinary dashboard
        // Steps to create upload preset:
        // 1. Go to https://cloudinary.com/console
        // 2. Navigate to: Settings > Upload > Upload presets
        // 3. Click "Add upload preset"
        // 4. Set "Signing mode" to "Unsigned"
        // 5. Give it a name (e.g., "pet_shop", "ml_default", or any name you prefer)
        // 6. Save the preset
        // 7. Use that name below or set VITE_CLOUDINARY_UPLOAD_PRESET in .env file

        const CLOUDINARY_CLOUD_NAME =
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "di2a8fvuv";
        // IMPORTANT: This preset MUST be set to "Unsigned" mode in Cloudinary
        // If you see "Upload preset not found" error, create a new unsigned preset
        // or update this value to match your unsigned preset name
        const CLOUDINARY_UPLOAD_PRESET =
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";

        if (!CLOUDINARY_UPLOAD_PRESET) {
          throw new Error(
            "Upload preset is not configured. Please set VITE_CLOUDINARY_UPLOAD_PRESET in your .env file or create a preset named 'ml_default' in Cloudinary dashboard."
          );
        }

        const uploadPromises = files.map((file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

          console.log(
            `Starting upload for file: ${file.name} with preset: ${CLOUDINARY_UPLOAD_PRESET}`
          );

          return fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              method: "POST",
              body: formData,
            }
          )
            .then((res) => {
              console.log(
                `Upload response status: ${res.status} for ${file.name}`
              );
              if (!res.ok) {
                return res.json().then((errorData) => {
                  console.error("Cloudinary error response:", errorData);
                  const errorMessage =
                    errorData.error?.message ||
                    `Cloudinary upload failed with status ${res.status}`;

                  // Provide helpful error message for missing preset
                  if (errorMessage.includes("preset") || res.status === 400) {
                    throw new Error(
                      `Upload preset "${CLOUDINARY_UPLOAD_PRESET}" not found. ` +
                        `Please create an unsigned upload preset with this name in your Cloudinary dashboard. ` +
                        `Go to: Settings > Upload > Upload presets > Add upload preset. ` +
                        `Set signing mode to "Unsigned" and name it "${CLOUDINARY_UPLOAD_PRESET}". ` +
                        `Or set VITE_CLOUDINARY_UPLOAD_PRESET in your .env file to use a different preset name.`
                    );
                  }

                  throw new Error(errorMessage);
                });
              }
              return res.json();
            })
            .then((data) => {
              console.log(`Upload successful for ${file.name}:`, data);
              if (!data.secure_url || !data.public_id) {
                console.error(
                  "Missing secure_url or public_id in response:",
                  data
                );
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
        console.log(`Successfully uploaded ${uploadResults.length} images`);

        const newImages: ProductImage[] = uploadResults.map(
          (
            result: { secure_url: string; public_id: string },
            index: number
          ) => ({
            id: `img-${Date.now()}-${index}`,
            imageUrl: result.secure_url,
            publicId: result.public_id,
            isPrimary: productImages.length === 0 && index === 0,
            position: productImages.length + index + 1,
          })
        );

        setProductImages((prev) => [...prev, ...newImages]);
        setMessage(`Successfully uploaded ${uploadResults.length} image(s)`);
      } catch (err: any) {
        console.error("Image upload exception:", err);
        const errorMessage =
          err?.message ||
          "Failed to upload images. Please check your Cloudinary configuration.";
        setUploadError(errorMessage);
      } finally {
        setUploadingImages(false);
      }
    },
    [productImages.length]
  );

  const removeImage = (imageId: string) => {
    setProductImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const setPrimaryImage = (imageId: string) => {
    setProductImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }))
    );
  };

  // ==================== Variant Management ====================

  const addVariant = () => {
    const newVariant: Variant = {
      id: `variant-${Date.now()}`,
      variantName: "",
      price: "",
      weight: "",
      stockQuantity: "",
      associatedImageUrls: [],
    };
    setVariants((prev) => [...prev, newVariant]);
  };

  const removeVariant = (variantId: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== variantId));
  };

  const updateVariant = (variantId: string, updates: Partial<Variant>) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, ...updates } : v))
    );
  };

  const toggleVariantImage = (variantId: string, imageUrl: string) => {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== variantId) return v;
        const hasImage = v.associatedImageUrls.includes(imageUrl);
        return {
          ...v,
          associatedImageUrls: hasImage
            ? v.associatedImageUrls.filter((url) => url !== imageUrl)
            : [...v.associatedImageUrls, imageUrl],
        };
      })
    );
  };

  // ==================== Form Submission ====================

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Validate required fields
      if (!name.trim()) {
        throw new Error("Product name is required");
      }

      if (nameExists === true) {
        throw new Error("Product name already exists");
      }

      if (!categoryId) {
        throw new Error("Category is required");
      }

      if (productImages.length === 0) {
        throw new Error("At least one image is required");
      }

      if (variants.length === 0) {
        throw new Error("At least one variant is required");
      }

      // Validate all variants
      for (const variant of variants) {
        if (!variant.variantName.trim()) {
          throw new Error("All variants must have a name");
        }
        if (Number(variant.price) <= 0) {
          throw new Error(
            `Variant "${variant.variantName}" must have a price > 0`
          );
        }
        if (Number(variant.stockQuantity) < 0) {
          throw new Error(
            `Variant "${variant.variantName}" must have stock quantity >= 0`
          );
        }
      }

      // Construct the DTO - match backend structure exactly
      const payload: CreateProductAllInOnePayload = {
        name: name.trim(),
        categoryId: Number(categoryId),
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        animal: animal.trim(),
        brand: brand.trim(),
        featured,
        images: productImages.map((img, index) => ({
          imageUrl: img.imageUrl,
          publicId: img.publicId,
          position: img.position ?? index + 1,
          primary: img.isPrimary ?? index === 0,
        })),
        variants: variants.map((variant) => ({
          variantName: variant.variantName.trim(),
          price: Number(variant.price) || 0,
          weight: Number(variant.weight) || 0,
          stockQuantity: Number(variant.stockQuantity) || 0,
          associatedImageUrls: variant.associatedImageUrls,
        })),
      };

      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      // Submit to API
      const res = await productApi.createAll(payload);
      const data = res?.data;

      // Check if request was successful (status 200-299)
      const isSuccess =
        (res?.status >= 200 && res?.status < 300) ||
        data?.success === true ||
        data?.code === 1000 ||
        data?.message?.toLowerCase().includes("success");

      if (isSuccess) {
        setError(null); // Clear any previous errors
        setMessage(
          "Product created successfully with all variants and images!"
        );
        reset();
        // Redirect to product list after 1.5 seconds
        setTimeout(() => {
          navigate("/product");
        }, 1500);
      } else {
        setMessage(null); // Clear any previous success messages
        setError(data?.message || "Unknown response from server");
      }
    } catch (err: any) {
      setMessage(null); // Clear any previous success messages
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create product";
      setError(errorMessage);
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Fetch Categories ====================

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setCatLoading(true);
      try {
        if (catAbortRef.current) {
          try {
            catAbortRef.current.abort();
          } catch {}
        }
        const controller = new AbortController();
        catAbortRef.current = controller;
        const res = await categoryApi.list(
          { pageNumber: 1, size: 1000, sort: "name,asc" },
          { signal: controller.signal }
        );
        const data = res?.data?.result ?? res?.data;
        const content = data?.content ?? data?.items ?? [];
        if (!mounted) return;
        const options = Array.isArray(content)
          ? content.map((c: any) => ({
              value: String(c.id),
              label: String(c.name ?? c.id),
            }))
          : [];
        setCatOptions(options);
      } catch (err: any) {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError")
          return;
        console.error("Failed to load categories", err);
      } finally {
        setCatLoading(false);
        catAbortRef.current = null;
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // ==================== Validation Functions ====================

  const canProceedToVariants = (): boolean => {
    return !!(
      name.trim() &&
      categoryId &&
      productImages.length > 0 &&
      nameExists === false && // ❌ trùng → chặn
      !nameChecking
    );
  };
  const goToStep = (step: "info" | "variants" | "review") => {
    // Luôn cho quay lại Info
    if (step === "info") {
      setCurrentStep("info");
      return;
    }

    // Info -> Variants
    if (step === "variants") {
      if (!canProceedToVariants()) return;
      setCurrentStep("variants");
      return;
    }

    // Variants -> Review
    if (step === "review") {
      if (!canProceedToReview()) return;
      setCurrentStep("review");
    }
  };

  const canProceedToReview = (): boolean => {
    return (
      variants.length > 0 &&
      variants.every(
        (v) =>
          v.variantName.trim() &&
          Number(v.price) > 0 &&
          Number(v.stockQuantity) > 0
      )
    );
  };

  // ==================== Render ====================

  return (
    <>
      <PageMeta
        title="Create Product - All in One"
        description="Create a product with images and variants"
      />
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Create Product - All in One</h2>

        {/* Alert Messages */}
        {error && (
          <div className="mb-4">
            <Alert variant="error" title="Error" message={error} />
          </div>
        )}
        {message && (
          <div className="mb-4">
            <Alert variant="success" title="Success" message={message} />
          </div>
        )}

        {/* Step Indicators */}
        <div className="mb-8 flex gap-4">
          {["info", "variants", "review"].map((step, idx) => (
            <div key={step} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToStep(step as any)}
                disabled={
                  (step === "variants" && !canProceedToVariants()) ||
                  (step === "review" && !canProceedToReview())
                }
                className={`w-10 h-10 rounded-full font-semibold transition
    ${
      currentStep === step
        ? "bg-indigo-600 text-white"
        : ["info", "variants"].includes(step) &&
          ["info", "variants", "review"].indexOf(currentStep) > idx
        ? "bg-green-500 text-white"
        : "bg-gray-300 text-gray-600"
    }
    ${
      (step === "variants" && !canProceedToVariants()) ||
      (step === "review" && !canProceedToReview())
        ? "cursor-not-allowed opacity-50"
        : "cursor-pointer"
    }
  `}
              >
                {idx + 1}
              </button>

              <span className="text-sm font-medium capitalize">{step}</span>
              {idx < 2 && <span className="text-gray-400">→</span>}
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="bg-white border rounded-lg p-6">
          {/* Step 1: General Info + Image Upload */}
          {currentStep === "info" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Step 1: General Information & Upload Images
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <div className="max-w-xs">
                    <Select
                      options={catOptions}
                      placeholder={
                        catLoading ? "Loading..." : "Select a category"
                      }
                      onChange={(val) => setCategoryId(val)}
                      defaultValue={categoryId}
                      compact
                      rows={6}
                      dropdown
                      searchable
                      showSearchInput={false}
                      searchInTrigger
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>

                  <input
                    value={name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setName(value);
                      checkProductName(value);
                    }}
                    type="text"
                    className={`w-full border rounded px-3 py-2 ${
                      nameExists === true
                        ? "border-red-500"
                        : nameExists === false
                        ? "border-green-500"
                        : ""
                    }`}
                    placeholder="Enter product name"
                  />

                  {/* STATUS MESSAGE */}
                  <div className="mt-1 text-sm">
                    {nameChecking && (
                      <span className="text-gray-500">Checking name...</span>
                    )}

                    {!nameChecking && nameExists === true && (
                      <span className="text-red-600">
                        ❌ Product name already exists
                      </span>
                    )}

                    {!nameChecking && nameExists === false && name.trim() && (
                      <span className="text-green-600">
                        ✔ Product name is available
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <input
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Short description (one line)"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded px-3 py-2 h-32"
                  placeholder="Detailed description..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Animal
                  </label>
                  <input
                    value={animal}
                    onChange={(e) => setAnimal(e.target.value)}
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Dog / Cat / Bird..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Royal Canin, Whiskas..."
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="featured" className="text-sm font-medium">
                  Featured Product
                </label>
              </div>

              {/* Image Upload Section */}
              <div className="mt-6 border-t pt-6">
                <h4 className="text-base font-semibold mb-4">
                  Upload Product Images *
                </h4>

                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop images or click to browse.
                </p>

                <ImageUploadDropzone
                  onImagesDrop={handleImageUpload}
                  isLoading={uploadingImages}
                />

                {uploadError && (
                  <div className="mt-3 text-sm text-red-600">{uploadError}</div>
                )}

                {/* Display uploaded images */}
                {productImages.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3">
                      Uploaded Images ({productImages.length})
                    </h4>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                      {productImages.map((img) => (
                        <div
                          key={img.id}
                          className={`relative group border-2 rounded overflow-hidden ${
                            img.isPrimary
                              ? "border-indigo-600"
                              : "border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <img
                            src={img.imageUrl}
                            alt="uploaded"
                            className="w-full h-24 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(img.id!)}
                              className="text-xs bg-white text-black px-2 py-1 rounded hover:bg-gray-200"
                              title="Set as primary"
                            >
                              {img.isPrimary ? "✓ Primary" : "Set Primary"}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(img.id!)}
                              className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  size="md"
                  type="button"
                  disabled={!canProceedToVariants() || loading}
                  onClick={() => setCurrentStep("variants")}
                  className="bg-indigo-600"
                >
                  {loading ? "Processing..." : "Next: Create Variants"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Add Variants */}
          {currentStep === "variants" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Step 2: Add Product Variants
              </h3>

              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  Add variants for your product. Each variant can have different
                  price, weight, and stock quantity.
                </p>
                <Button
                  size="sm"
                  type="button"
                  onClick={addVariant}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  + Add Variant
                </Button>
              </div>

              {variants.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 mb-2">No variants added yet</p>
                  <p className="text-sm text-gray-400">
                    Click "Add Variant" to create your first variant
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {variants.map((variant, index) => (
                    <div
                      key={variant.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-700">
                          Variant #{index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove variant"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Variant Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={variant.variantName}
                            onChange={(e) =>
                              updateVariant(variant.id, {
                                variantName: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g., Thức ăn cho chó con"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Price <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            inputMode="decimal"
                            value={variant.price}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (Number(value) < 0) return;
                              updateVariant(variant.id, { price: value });
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            placeholder="VD: 12500.50"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={variant.weight}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numValue = Number(value);
                              if (numValue < 0) {
                                updateVariant(variant.id, { weight: "0" });
                              } else {
                                updateVariant(variant.id, {
                                  weight: value.replace(/^0+/, "") || "0",
                                });
                              }
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Stock Quantity{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            inputMode="numeric"
                            value={variant.stockQuantity}
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^0-9]/g,
                                ""
                              ); // Only allow digits
                              const numValue = Number(value);
                              if (numValue < 0) {
                                updateVariant(variant.id, {
                                  stockQuantity: "0",
                                });
                              } else {
                                updateVariant(variant.id, {
                                  stockQuantity:
                                    value.replace(/^0+/, "") || "0",
                                });
                              }
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="0"
                            required
                          />
                        </div>
                      </div>

                      {/* Image Selection for Variant */}
                      {productImages.length > 0 && (
                        <div className="mt-4">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Select Images for this Variant (Click to toggle)
                          </label>
                          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {productImages.map((img) => {
                              const isSelected =
                                variant.associatedImageUrls.includes(
                                  img.imageUrl
                                );
                              return (
                                <button
                                  key={img.id}
                                  type="button"
                                  onClick={() =>
                                    toggleVariantImage(variant.id, img.imageUrl)
                                  }
                                  className={`relative rounded-lg overflow-hidden border-2 transition ${
                                    isSelected
                                      ? "border-indigo-600 ring-2 ring-indigo-400"
                                      : "border-gray-200 hover:border-gray-400"
                                  }`}
                                >
                                  <img
                                    src={img.imageUrl}
                                    alt="variant"
                                    className="w-full h-16 object-cover"
                                  />
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                        <svg
                                          className="w-4 h-4 text-white"
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
                          {variant.associatedImageUrls.length > 0 && (
                            <p className="text-xs text-gray-500 mt-2">
                              {variant.associatedImageUrls.length} image(s)
                              selected
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Button
                  size="md"
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep("info")}
                >
                  Back
                </Button>
                <Button
                  size="md"
                  type="button"
                  disabled={!canProceedToReview()}
                  onClick={() => setCurrentStep("review")}
                  className="bg-indigo-600"
                >
                  Next: Review & Submit
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {currentStep === "review" && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Step 3: Review & Submit
              </h3>

              <div className="space-y-4 bg-gray-50 p-4 rounded-lg mb-6">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Product Name:
                  </span>
                  <p className="text-gray-900">{name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Category ID:
                  </span>
                  <p className="text-gray-900">{categoryName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Featured:
                  </span>
                  <p className="text-gray-900">{featured ? "Yes" : "No"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Animal:
                  </span>
                  <p className="text-gray-900">{animal || "-"}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Brand:
                  </span>
                  <p className="text-gray-900">{brand || "-"}</p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Images:
                  </span>
                  <p className="text-gray-900">{productImages.length} images</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Variants:
                  </span>
                  <p className="text-gray-900">{variants.length} variants</p>
                </div>
              </div>

              {/* Summary Table */}
              <div className="mb-6 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="border px-3 py-2 text-left">
                        Variant Name
                      </th>
                      <th className="border px-3 py-2 text-right">Price</th>
                      <th className="border px-3 py-2 text-right">
                        Weight (kg)
                      </th>
                      <th className="border px-3 py-2 text-right">Stock</th>
                      <th className="border px-3 py-2 text-center">Images</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant) => (
                      <tr
                        key={variant.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="border px-3 py-2">
                          {variant.variantName}
                        </td>
                        <td className="border px-3 py-2 text-right">
                          {Number(variant.price).toLocaleString("vi-VN")} VND
                        </td>
                        <td className="border px-3 py-2 text-right">
                          {(Number(variant.weight) || 0).toFixed(1)}
                        </td>
                        <td className="border px-3 py-2 text-right">
                          {variant.stockQuantity}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          {variant.associatedImageUrls.length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  size="md"
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep("variants")}
                >
                  Back
                </Button>
                <Button
                  size="md"
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Submitting..." : "Submit & Create Product"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
