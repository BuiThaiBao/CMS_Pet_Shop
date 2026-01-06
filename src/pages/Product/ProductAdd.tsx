import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import productApi from "../../services/api/productApi";
import Select from "../../components/form/Select";
import categoryApi from "../../services/api/categoryApi";

export default function ProductAdd() {
  const { t } = useTranslation();
  const [categoryId, setCategoryId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [shortDescription, setShortDescription] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [animal, setAnimal] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [catOptions, setCatOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [catLoading, setCatLoading] = useState<boolean>(false);
  const catAbortRef = useRef<AbortController | null>(null);

  const reset = () => {
    setCategoryId("");
    setName("");
    setShortDescription("");
    setDescription("");
    setAnimal("");
    setBrand("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        categoryId: categoryId ? Number(categoryId) : undefined,
        name,
        shortDescription,
        description,
        animal,
        brand,
        // No price field per request
      };
      const res = await productApi.create(payload);
      const data = res?.data;
      if (data?.success || data?.code === 1000) {
        setMessage(t('product.createSuccess'));
        reset();
      } else {
        setError(data?.message || t('messages.unknownResponse'));
      }
    } catch (err: any) {
      setError(err?.message || t('product.createError'));
    } finally {
      setLoading(false);
    }
  };

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
        // Ignore canceled errors
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError")
          return;
        // Non-blocking: just log; page can still submit with manual ID if needed
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

  return (
    <>
      <PageMeta title={t('product.addProduct')} description={t('product.addProductDescription')} />
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">{t('product.addProduct')}</h2>

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

          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">Animal</label>
            <textarea
              value={animal}
              onChange={(e) => setAnimal(e.target.value)}
              className="w-full border rounded px-3 py-2 h-36"
              placeholder={t('product.animalType')}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">{t('product.brand')}</label>
            <textarea
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full border rounded px-3 py-2 h-36"
              placeholder={t('product.brandName')}
            />
          </div>

          {/* Price removed */}

          <div className="mt-6 flex items-center gap-3">
            <Button
              size="md"
              type="submit"
              disabled={loading}
              className="bg-indigo-600"
            >
              {loading ? t('common.saving') : t('common.save')}
            </Button>
            <Button size="md" variant="outline" type="button" onClick={reset}>
              {t('common.reset')}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
