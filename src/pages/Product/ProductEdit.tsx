import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import productApi from "../../services/api/productApi";
import variantApi from "../../services/api/variantApi";
import imageApi from "../../services/api/imageApi";
import Select from "../../components/form/Select";
import categoryApi from "../../services/api/categoryApi";
import VariantAddModal from "../../components/Product/VariantAddModal";
import VariantEditModal from "../../components/Product/VariantEditModal";
import ProductImageUploadModal from "../../components/Product/ProductImageUploadModal";
import ImageModal from "../../components/common/ImageModal";

type ProductImage = {
  id: number;
  productId: number;
  imageUrl: string;
  position?: number;
  isPrimary?: number;
  isDeleted?: string;
};

type ProductVariant = {
  id: number;
  productId: number;
  productImageId?: number;
  variantName: string;
  weight?: number;
  price: number;
  stockQuantity: number;
  soldQuantity: number;
  isDeleted: string;
  createdDate?: string;
  updatedDate?: string;
};

export default function ProductEdit() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [categoryId, setCategoryId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [shortDescription, setShortDescription] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState<string>("0");
  const [isDeleted, setIsDeleted] = useState<string>("0");

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [catOptions, setCatOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [catLoading, setCatLoading] = useState<boolean>(false);
  const catAbortRef = useRef<AbortController | null>(null);

  // Variant and image management
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [isAddVariantModalOpen, setIsAddVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [isEditVariantModalOpen, setIsEditVariantModalOpen] = useState(false);
  const [togglingVariantId, setTogglingVariantId] = useState<number | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      setLoadingData(true);
      setError(null);
      try {
        const res = await productApi.getById(id);
        const data = res?.data?.result ?? res?.data;
        if (data) {
          setName(data.name || "");
          setShortDescription(data.shortDescription || "");
          setDescription(data.description || "");
          setCategoryId(data.categoryId ? String(data.categoryId) : "");
          setIsFeatured(data.isFeatured || "0");
          setIsDeleted(data.isDeleted || "0");
          // Load variants and images
          setVariants(data.productVariant || []);
          setProductImages(data.productImage || []);
        }
      } catch (err: any) {
        setError(err?.message || t('messages.loadError'));
      } finally {
        setLoadingData(false);
      }
    };
    loadProduct();
  }, [id, t]);

  // Fetch categories for dropdown
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        categoryId: categoryId ? Number(categoryId) : undefined,
        name,
        shortDescription,
        description,
        isFeatured: isFeatured as "0" | "1",
        isDeleted: isDeleted as "0" | "1",
      };
      const res = await productApi.update(id, payload);
      const data = res?.data;
      if (data?.success || data?.code === 1000) {
        setMessage(t('product.updateSuccess'));
        setTimeout(() => {
          navigate("/product");
        }, 1500);
      } else {
        setError(data?.message || t('messages.unknownResponse'));
      }
    } catch (err: any) {
      setError(err?.message || t('product.updateError'));
    } finally {
      setLoading(false);
    }
  };

  // Refresh product data (for after variant changes)
  const refreshProductData = async () => {
    if (!id) return;
    try {
      const res = await productApi.getById(id);
      const data = res?.data?.result ?? res?.data;
      if (data) {
        setVariants(data.productVariant || []);
        setProductImages(data.productImage || []);
      }
    } catch (err: any) {
      console.error("Failed to refresh product data:", err);
    }
  };

  // Variant management handlers
  const handleOpenAddVariant = () => {
    setIsAddVariantModalOpen(true);
  };

  const handleCloseAddVariant = () => {
    setIsAddVariantModalOpen(false);
  };

  const handleAddVariantSuccess = () => {
    refreshProductData();
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setIsEditVariantModalOpen(true);
  };

  const handleCloseEditVariant = () => {
    setIsEditVariantModalOpen(false);
    setEditingVariant(null);
  };

  const handleEditVariantSuccess = () => {
    refreshProductData();
  };

  const handleToggleVariantDeleted = async (variant: ProductVariant) => {
    const newDeletedStatus = variant.isDeleted === "1" ? "0" : "1";
    setTogglingVariantId(variant.id);

    // Optimistic update
    const updatedVariants = variants.map((v) =>
      v.id === variant.id ? { ...v, isDeleted: newDeletedStatus } : v
    );
    setVariants(updatedVariants);

    try {
      const payload = {
        variantName: variant.variantName,
        weight: variant.weight || null,
        price: variant.price,
        stockQuantity: variant.stockQuantity,
        soldQuantity: variant.soldQuantity,
        isDeleted: newDeletedStatus,
      };

      const response = await variantApi.update(variant.id, payload);
      const data = response?.data;

      if (!data?.success && data?.code !== 1000) {
        // Revert on error
        setVariants(variants);
        setError(data?.message || "Failed to update variant status");
      } else {
        refreshProductData();
      }
    } catch (err: any) {
      // Revert on error
      setVariants(variants);
      setError(err?.message || "An error occurred");
    } finally {
      setTogglingVariantId(null);
    }
  };

  // Image upload handlers
  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleUploadSuccess = () => {
    refreshProductData();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!window.confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      return;
    }

    setDeletingImageId(imageId);

    // Optimistic update - remove image from UI immediately
    const previousImages = productImages;
    const updatedImages = productImages.filter(img => img.id !== imageId);
    setProductImages(updatedImages);

    try {
      await imageApi.delete(imageId);
      // Success - refresh to ensure data consistency
      refreshProductData();
    } catch (err: any) {
      // Revert on error
      setProductImages(previousImages);
      setError(err?.message || "Failed to delete image");
    } finally {
      setDeletingImageId(null);
    }
  };

  if (loadingData) {
    return (
      <>
        <PageMeta title={t('product.editProduct')} description={t('product.editProductDescription')} />
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={t('product.editProduct')} description={t('product.editProductDescription')} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('product.editProduct')}</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/product")}
          >
            ← {t('common.backToList')}
          </Button>
        </div>

        <form onSubmit={submit} className="bg-white border rounded-lg p-6">
          {error && (
            <div className="mb-3">
              <Alert variant="error" title={t('common.error')} message={error} />
            </div>
          )}
          {message && (
            <div className="mb-3">
              <Alert variant="success" title={t('common.success')} message={message} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Category
              </label>
              <div className="max-w-xs">
                <Select
                  options={catOptions}
                  placeholder={
                    catLoading ? t('product.loadingCategories') : t('product.selectCategory')
                  }
                  onChange={(val) => setCategoryId(val)}
                  className=""
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
              <label className="block text-sm text-gray-600 mb-1">{t('product.productName')}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
                placeholder={t('product.enterProductName')}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">
              {t('product.shortDescription')}
            </label>
            <input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder={t('product.enterShortDescription')}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">
              {t('common.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2 h-36"
              placeholder={t('common.enterDescription')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('product.featured')}
              </label>
              <select
                value={isFeatured}
                onChange={(e) => setIsFeatured(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="0">{t('common.no')}</option>
                <option value="1">{t('common.yes')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('common.status')}</label>
              <select
                value={isDeleted}
                onChange={(e) => setIsDeleted(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="0">{t('common.active')}</option>
                <option value="1">{t('common.deleted')}</option>
              </select>
            </div>
          </div>
                

          <div className="mt-6 flex items-center gap-3 flex justify-end">
            <Button
              size="md"
              type="submit"
              disabled={loading}
              className="bg-indigo-600 "
            >
              {loading ? t('common.saving') : t('common.saveChanges')}
            </Button>
            <Button
              size="md"
              variant="outline"
              type="button"
              onClick={() => navigate("/product")}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
                  {/* Variant Add Modal */}
      {id && (
        <VariantAddModal
          isOpen={isAddVariantModalOpen}
          onClose={handleCloseAddVariant}
          productId={parseInt(id)}
          productImages={productImages?.map((img) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary,
          }))}
          onAddSuccess={handleAddVariantSuccess}
        />
      )}

      {/* Variant Edit Modal */}
      {editingVariant && id && (
        <VariantEditModal
          isOpen={isEditVariantModalOpen}
          onClose={handleCloseEditVariant}
          variant={editingVariant}
          productImages={productImages?.map((img) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary,
          }))}
          onUpdateSuccess={handleEditVariantSuccess}
        />
      )}

      {/* Product Image Upload Modal */}
      {id && (
        <ProductImageUploadModal
          isOpen={isUploadModalOpen}
          onClose={handleCloseUploadModal}
          productId={parseInt(id)}
          onUploadSuccess={handleUploadSuccess}
          existingImageCount={productImages?.length || 0}
        />
      )}

      {/* Image Zoom Modal */}
      {isImageModalOpen && selectedImage && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={handleCloseImageModal}
          imageUrl={selectedImage}
          alt={name || "Product Image"}
        />
      )}
              {/* Product Images and Variants Section */}
        <div className="mt-6 bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Hình ảnh & Loại sản phẩm</h3>
            <button
              type="button"
              onClick={handleOpenUploadModal}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Tải lên hình ảnh
            </button>
          </div>

          {/* Product Images Section */}
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-3">Hình ảnh sản phẩm</h4>
            {productImages && productImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productImages.map((img) => (
                  <div
                    key={img.id}
                    className="border rounded-lg overflow-hidden bg-gray-50 group hover:shadow-lg transition-shadow relative"
                  >
                    {/* Primary Badge */}
                    {img.isPrimary === 1 && (
                      <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Primary
                      </div>
                    )}

                    {/* Position Badge */}
                    {img.position !== undefined && (
                      <div className="absolute bottom-14 left-2 z-10 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                        Pos: {img.position}
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(img.id);
                      }}
                      disabled={deletingImageId === img.id}
                      className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete image"
                    >
                      {deletingImageId === img.id ? (
                        <svg
                          className="animate-spin h-4 w-4"
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
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>

                    <div
                      className="relative overflow-hidden cursor-pointer"
                      onClick={() => handleImageClick(img.imageUrl)}
                    >
                      <img
                        src={img.imageUrl}
                        alt={`Product ${name}`}
                        className="w-full h-40 object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "https://via.placeholder.com/300x300?text=No+Image";
                        }}
                      />
                      {/* Hover overlay with zoom icon */}
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <svg
                          className="w-10 h-10 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="p-2 text-xs text-gray-500">
                      ID: {img.id}
                      {img.isDeleted === "1" && (
                        <span className="ml-2 text-red-600 font-semibold">
                          (Deleted)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">
                  Chưa có hình ảnh. Click "Tải lên hình ảnh" để thêm ảnh.
                </p>
              </div>
            )}
          </div>

          {/* Variants Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold">Loại sản phẩm</h4>
              <button
                type="button"
                onClick={handleOpenAddVariant}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Thêm loại sản phẩm
              </button>
            </div>

            {variants && variants.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border">
                  <thead className="bg-gray-50">
                    <tr className="text-sm text-gray-600">
                      <th className="py-3 px-4 border-b">ID</th>
                      <th className="py-3 px-4 border-b">Tên biến thể</th>
                      <th className="py-3 px-4 border-b">Khối lượng (g)</th>
                      <th className="py-3 px-4 border-b">Giá</th>
                      <th className="py-3 px-4 border-b">Tồn kho</th>
                      <th className="py-3 px-4 border-b">Đã bán</th>
                      <th className="py-3 px-4 border-b">Trạng thái</th>
                      <th className="py-3 px-4 border-b">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant) => (
                      <tr key={variant.id} className="border-b">
                        <td className="py-3 px-4 text-sm">{variant.id}</td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {variant.variantName}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {variant.weight ? `${variant.weight}g` : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-indigo-600">
                          {formatCurrency(variant.price)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {variant.stockQuantity}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {variant.soldQuantity}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-3">
                            {/* Toggle Switch */}
                            <button
                              onClick={() =>
                                handleToggleVariantDeleted(variant)
                              }
                              disabled={togglingVariantId === variant.id}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                variant.isDeleted === "1"
                                  ? "bg-red-600"
                                  : "bg-green-600"
                              }`}
                              title={
                                togglingVariantId === variant.id
                                  ? "Updating..."
                                  : variant.isDeleted === "1"
                                  ? "Click to activate"
                                  : "Click to delete"
                              }
                            >
                              {togglingVariantId === variant.id ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                </div>
                              ) : (
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    variant.isDeleted === "1"
                                      ? "translate-x-6"
                                      : "translate-x-1"
                                  }`}
                                />
                              )}
                            </button>
                            {/* Status Badge */}
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                variant.isDeleted === "1"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {togglingVariantId === variant.id
                                ? "Updating..."
                                : variant.isDeleted === "1"
                                ? "Đã xóa"
                                : "Hoạt động"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <button
                            onClick={() => handleEditVariant(variant)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-500">
                  Chưa có loại sản phẩm. Click "Thêm loại sản phẩm" để tạo mới.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
