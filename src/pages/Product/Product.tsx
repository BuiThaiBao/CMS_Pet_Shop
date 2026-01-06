import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import Switch from "../../components/form/switch/Switch";
import Select from "../../components/form/Select";
import productApi from "../../services/api/productApi";
import categoryApi from "../../services/api/categoryApi";
import ProductDetailModal from "../../components/Product/ProductDetailModal";
import ProductImageUploadModal from "../../components/Product/ProductImageUploadModal";

export type ProductItem = {
  id: number;
  categoryId?: number;
  categoryName?: string;
  name: string;
  shortDescription?: string;
  description?: string;

  soldQuantity?: number | string;
  stock?: number | string;
  stockQuantity?: number | string;
  isDeleted?: string;
  isFeatured?: string;
  createdDate?: string;
  updatedDate?: string;
};

export default function Product() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProductItem[]>([]);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    "asc"
  );
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProductId, setUploadProductId] = useState<number | null>(null);

  // Category filter states
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryApi.list({
          pageNumber: 1,
          size: 1000, // Get all categories
        });
        const data = res?.data?.result ?? res?.data;
        if (data?.content) {
          setCategories(data.content);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      await fetchProducts(pageNumber, pageSize, query);
    };
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize, query, sortDirection, selectedCategoryId]);

  async function fetchProducts(page: number, size: number, q?: string) {
    setLoading(true);
    setError(null);
    try {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
      }
      const controller = new AbortController();
      abortRef.current = controller;
      const params: {
        pageNumber: number;
        size: number;
        search?: string;
        sort?: string;
        categoryId?: number;
      } = {
        pageNumber: page,
        size,
        search: q ?? undefined,
        sort: sortDirection ? `id,${sortDirection}` : undefined,
        categoryId: selectedCategoryId ? Number(selectedCategoryId) : undefined,
      };
      const res = await productApi.list(params, { signal: controller.signal });
      const data = res?.data?.result ?? res?.data;
      if (data) {
        setItems(data.content || []);
        setTotalPages(data.totalPages ?? 0);
        setTotalElements(data.totalElements ?? 0);
        const serverPageRaw =
          typeof data.number === "number"
            ? data.number
            : (data.pageable?.pageNumber as number | undefined);
        const serverSize = data.size ?? data.pageable?.pageSize ?? size;
        let resolvedPage = page;
        if (typeof serverPageRaw === "number") {
          if (serverPageRaw === page - 1) resolvedPage = serverPageRaw + 1;
          else if (serverPageRaw === page) resolvedPage = serverPageRaw;
        }
        setPageNumber(resolvedPage);
        setPageSize(serverSize);
      } else {
        setItems([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      console.error(err);
      setError(err?.message || t('messages.loadError'));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setPageNumber(1);
      setQuery(searchInput.trim());
    }, 150);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function handleToggleField(
    id: number,
    field: "isFeatured" | "isDeleted",
    checked: boolean
  ) {
    const newValue: "0" | "1" = checked ? "1" : "0";
    const current = items.find((it) => it.id === id);
    if (!current) return;

    console.log("Current product being toggled:", current);

    const prevItems = items;
    const nextItems = items.map((it) => {
      if (it.id !== id) return it;
      const updated: ProductItem = { ...it, [field]: newValue } as ProductItem;
      if (field === "isDeleted" && newValue === "1") {
        updated.isFeatured = "0";
      }
      return updated;
    });
    setItems(nextItems);
    const setCopy = new Set(updatingIds);
    setCopy.add(id);
    setUpdatingIds(setCopy);

    try {
      const computedIsFeatured: "0" | "1" =
        field === "isFeatured"
          ? newValue
          : field === "isDeleted" && newValue === "1"
          ? "0"
          : (current.isFeatured as "0" | "1" | undefined) ?? "0";
      const payload: any = {
        name: current.name,
        shortDescription: current.shortDescription ?? "",
        description: current.description ?? "",
        soldQuantity: current.soldQuantity ?? 0,
        stockQuantity: (current as any).stockQuantity ?? current.stock ?? 0,
        isFeatured: computedIsFeatured,
        isDeleted: (field === "isDeleted"
          ? newValue
          : (current.isDeleted as "0" | "1" | undefined) ?? "0") as "0" | "1",
      };
      // Include categoryId if it exists
      if (current.categoryId !== undefined && current.categoryId !== null) {
        payload.categoryId = current.categoryId;
      }
      await productApi.update(id, payload);
    } catch (err: any) {
      setItems(prevItems);
      setError(err?.message || t('messages.updateError'));
    } finally {
      const after = new Set(updatingIds);
      after.delete(id);
      setUpdatingIds(after);
    }
  }

  const handleViewDetail = (productId: number) => {
    setSelectedProductId(productId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProductId(null);
  };

  const handleOpenUploadModal = (productId: number) => {
    setUploadProductId(productId);
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadProductId(null);
  };

  const handleUploadSuccess = () => {
    // Refresh product list or detail modal
    fetchProducts(pageNumber, pageSize, query);
  };

  return (
    <>
      <PageMeta title={t('product.title')} description={t('product.productList')} />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{t('product.productList')}</h1>
            <p className="mt-2 text-sm text-gray-600">{t('product.manageProducts')}</p>
          </div>
          <button
            onClick={() => navigate("/product/add-all-in-one")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('product.addProduct')}
          </button>
        </div>
        <div className="mt-4 bg-white rounded-lg border">
          {error && (
            <div className="p-4">
              <Alert variant="error" title={t('common.error')} message={error} />
            </div>
          )}
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    {t('product.searchProducts')}
                  </label>
                  <div className="relative w-80">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      type="search"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder={t('common.search')}
                      aria-label="Search products"
                      className="w-full pl-11 pr-10 py-2 rounded-lg border focus:outline-none focus:ring"
                    />
                    {loading && (
                      <span className="absolute inset-y-0 right-3 flex items-center">
                        <svg
                          className="animate-spin h-5 w-5 text-gray-500"
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
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    {t('product.filterByCategory')}
                  </label>
                  <div className="w-64">
                    <Select
                      options={[
                        { value: "", label: t('product.allCategories') },
                        ...categories.map((cat) => ({
                          value: String(cat.id),
                          label: cat.name,
                        })),
                      ]}
                      placeholder={t('product.selectCategory')}
                      defaultValue={selectedCategoryId}
                      onChange={(value) => {
                        setSelectedCategoryId(value);
                        setPageNumber(1); // Reset to first page when filter changes
                      }}
                      dropdown={true}
                      searchable={true}
                      searchInTrigger={true}
                    />
                  </div>
                </div>
              </div>
              <div />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-gray-500 border-b">
                    <th className="py-3 px-4">
                      <div className="inline-flex items-center gap-2">
                        <span>{t('product.productName')}</span>
                        <div className="flex flex-col items-center text-gray-400">
                          <button
                            type="button"
                            onClick={() => {
                              setSortDirection("asc");
                              setPageNumber(1);
                            }}
                            aria-label="Sort ascending"
                            className={`p-0.5 ${
                              sortDirection === "asc" ? "text-brand-500" : ""
                            }`}
                          >
                            <svg
                              width="10"
                              height="6"
                              viewBox="0 0 10 6"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 0L9.33013 6H0.669873L5 0Z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSortDirection("desc");
                              setPageNumber(1);
                            }}
                            aria-label="Sort descending"
                            className={`p-0.5 ${
                              sortDirection === "desc" ? "text-brand-500" : ""
                            }`}
                          >
                            <svg
                              width="10"
                              height="6"
                              viewBox="0 0 10 6"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 6L0.669873 0H9.33013L5 6Z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </th>
                    <th className="py-3 px-4">{t('product.shortDescription')}</th>

                    <th className="py-3 px-4">{t('product.sold')}</th>
                    <th className="py-3 px-4">{t('product.stock')}</th>
                    <th className="py-3 px-4">{t('product.featured')}</th>
                    <th className="py-3 px-4">{t('common.deleted')}</th>
                    <th className="py-3 px-4">{t('common.createdAt')}</th>
                    <th className="py-3 px-4">{t('common.updatedAt')}</th>
                    <th className="py-3 px-4">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="p-6 text-center">
                        {t('common.loading')}
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="p-6 text-center text-gray-500"
                      >
                        {t('product.noProducts')}
                      </td>
                    </tr>
                  ) : (
                    items.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-4 px-4">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-gray-400">
                            ID: {p.id}{" "}
                            {p.categoryName
                              ? `• ${t('product.category')}: ${p.categoryName}`
                              : ""}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 w-[240px] truncate">
                          {p.shortDescription}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {p.soldQuantity ?? 0}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {p.stockQuantity ?? p.stock ?? 0}
                        </td>
                        <td className="py-4 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Switch
                              key={`feat-${p.id}-${p.isFeatured}`}
                              label=""
                              color={p.isFeatured === "1" ? "green" : "gray"}
                              disabled={updatingIds.has(p.id)}
                              defaultChecked={p.isFeatured === "1"}
                              onChange={(checked) =>
                                handleToggleField(p.id, "isFeatured", checked)
                              }
                            />
                            <span
                              className={`text-sm font-medium ${
                                p.isFeatured === "1"
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {p.isFeatured === "1" ? t('common.yes') : t('common.no')}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Switch
                              key={`del-${p.id}-${p.isDeleted}`}
                              label=""
                              color={p.isDeleted === "0" ? "green" : "red"}
                              disabled={updatingIds.has(p.id)}
                              defaultChecked={p.isDeleted === "0"}
                              onChange={(checked) =>
                                handleToggleField(p.id, "isDeleted", !checked)
                              }
                            />
                            <span
                              className={`text-sm font-medium ${
                                p.isDeleted === "0"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {p.isDeleted === "0" ? t('common.active') : t('common.deleted')}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {p.createdDate}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {p.updatedDate}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                              onClick={() => navigate(`/product/edit/${p.id}`)}
                              title="Edit product and variants"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              {t('common.edit')}
                            </button>
                            <button
                              className="inline-flex whitespace-nowrap items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                              onClick={() => handleViewDetail(p.id)}
                              title="View product details (Read-only)"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              {t('common.details')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {t('common.showing')} {items.length} {t('common.of')} {totalElements} {t('product.products')}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber <= 1}
                  aria-label="Previous page"
                  className={`w-9 h-9 flex items-center justify-center border rounded-lg ${
                    pageNumber <= 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                {Array.from({ length: Math.max(totalPages, 0) }).map(
                  (_, idx) => {
                    const p = idx + 1;
                    const active = p === pageNumber;
                    return (
                      <button
                        key={p}
                        onClick={() => setPageNumber(p)}
                        aria-current={active ? "page" : undefined}
                        className={`transition-all ${
                          active
                            ? "w-9 h-9 flex items-center justify-center text-sm rounded-md bg-indigo-600 text-white shadow"
                            : "px-2 text-sm text-gray-700"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                )}
                <button
                  onClick={() => {
                    const target = pageNumber + 1;
                    if (totalPages && target > totalPages) return;
                    setPageNumber(target);
                  }}
                  disabled={totalPages ? pageNumber >= totalPages : false}
                  aria-label="Next page"
                  className={`w-9 h-9 flex items-center justify-center border rounded-lg ${
                    totalPages && pageNumber >= totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        productId={selectedProductId}
        onOpenUpload={handleOpenUploadModal}
      />

      {/* Product Image Upload Modal */}
      <ProductImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        productId={uploadProductId}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
}
