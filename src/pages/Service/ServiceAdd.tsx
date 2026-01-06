import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import serviceApi from "../../services/api/serviceApi";
import Select from "../../components/form/Select";
import { TrashBinIcon } from "../../icons";

export default function ServiceAdd() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | string>("");
  const [price, setPrice] = useState<number | string>("");
  const [bookingTimes, setBookingTimes] = useState([{ startTime: "", maxCapacity: "" }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [titleSuccess, setTitleSuccess] = useState<string | null>(null);
  const titleCheckTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!title.trim()) {
      setTitleError(null);
      setTitleSuccess(null);
      if (titleCheckTimeoutRef.current) {
        clearTimeout(titleCheckTimeoutRef.current);
        titleCheckTimeoutRef.current = null;
      }
    }
  }, [title]);

  const serviceOptions = [
    { value: "veterinary", label: "Dịch vụ thú y" },
    { value: "grooming", label: "Chăm sóc/ Tắm rửa" },
    { value: "haircut", label: "Cắt tỉa lông" },
    { value: "vaccination", label: "Tiêm chủng" },
    { value: "petboarding", label: "Lưu trú thú cưng" },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        name,
        title,
        description,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        price: price ? Number(price) : undefined,
        bookingTimes: bookingTimes.map(slot => ({
          startTime: slot.startTime,
          maxCapacity: Number(slot.maxCapacity)
        })),
      };
      const res = await serviceApi.create(payload);
      const data = res?.data;
      if (data?.success || data?.code === 1000) {
        setMessage(t('service.createSuccess'));
        setTimeout(() => {
          navigate("/service");
        }, 1500);
      } else {
        setError(data?.message || t('category.unknownResponse'));
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('service.createError'));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setName("");
    setTitle("");
    setDescription("");
    setDurationMinutes("");
    setPrice("");
    setBookingTimes([{ startTime: "", maxCapacity: "" }]);
    setTitleError(null);
    setTitleSuccess(null);
  };

  const checkTitle = useCallback(async (value: string) => {
    if (!value.trim()) {
      setTitleError(null);
      setTitleSuccess(null);
      return;
    }
    try {
      const res = await serviceApi.checkTitle(value);
      const data = res?.data;
      if (data?.success && data?.result) {
        if (!data.result.valid) {
          setTitleError(data.result.message);
          setTitleSuccess(null);
        } else {
          setTitleError(null);
          setTitleSuccess("Tên dịch vụ hợp lệ");
        }
      } else {
        setTitleError(null);
        setTitleSuccess(null);
      }
    } catch (err) {
      setTitleError(null);
      setTitleSuccess(null);
    }
  }, []);

  const debouncedCheckTitle = useCallback((value: string) => {
    if (titleCheckTimeoutRef.current) {
      clearTimeout(titleCheckTimeoutRef.current);
    }
    if (!value.trim()) {
      setTitleError(null);
      setTitleSuccess(null);
      return;
    }
    titleCheckTimeoutRef.current = setTimeout(() => {
      checkTitle(value);
    }, 500);
  }, [checkTitle]);

  return (
    <>
      <PageMeta title={t('service.addService')} description={t('service.createNewService')} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('service.addService')}</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/service")}
          >
            ← {t('common.backToList')}
          </Button>
        </div>

        <form onSubmit={submit} className="bg-white border rounded-lg p-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('service.icon')} *
              </label>
              <Select
                options={serviceOptions}
                onChange={setName}
                defaultValue=""
                placeholder="Chọn loại dịch vụ"
                required
                dropdown
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('service.serviceName')} *</label>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleError(null);
                  setTitleSuccess(null);
                  debouncedCheckTitle(e.target.value);
                }}
                className="w-full border rounded px-3 py-2"
                placeholder={t('service.enterServiceTitle')}
              />
              {titleError && (
                <p className="text-red-500 text-sm mt-1">{titleError}</p>
              )}
              {titleSuccess && (
                <p className="text-green-500 text-sm mt-1">{titleSuccess}</p>
              )}
            </div>
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
                {t('service.duration')}
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder={t('service.enterDuration')}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('service.priceVND')}
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder={t('service.enterPrice')}
                min="0"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-2">{t('service.bookingTimes')}</label>
            {bookingTimes.map((slot, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => {
                    const newSlots = [...bookingTimes];
                    newSlots[index].startTime = e.target.value;
                    setBookingTimes(newSlots);
                  }}
                  className="border rounded px-3 py-2 w-32"
                  required
                  aria-label="Start Time"
                  title="Start Time"
                />
                <input
                  type="number"
                  value={slot.maxCapacity}
                  onChange={(e) => {
                    const newSlots = [...bookingTimes];
                    newSlots[index].maxCapacity = e.target.value;
                    setBookingTimes(newSlots);
                  }}
                  className="border rounded px-3 py-2 w-20"
                  placeholder={t('service.max')}
                  min="1"
                  required
                  aria-label="Max Capacity"
                  title="Max Capacity"
                />
                {bookingTimes.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBookingTimes(bookingTimes.filter((_, i) => i !== index));
                    }}
                  >
                    <TrashBinIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBookingTimes([...bookingTimes, { startTime: "", maxCapacity: "" }])}
            >
              {t('service.addSlot')}
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-3">
            {name && title && bookingTimes.some(slot => slot.startTime && slot.maxCapacity) && (
              <Button
                size="md"
                type="submit"
                disabled={loading}
                className="bg-indigo-600"
              >
                {loading ? t('common.saving') : t('common.save')}
              </Button>
            )}
            <Button size="md" variant="outline" type="button" onClick={reset}>
              {t('common.reset')}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
