import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import adoptApi from '../../services/api/adoptApi';
import petApi from '../../services/api/petApi';
import './Adopt.css';

export default function Adopt() {
  const { t } = useTranslation();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [petId, setPetId] = useState('');
  const [code, setCode] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pets, setPets] = useState<any[]>([]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, debouncedCode, petId, size]);

  useEffect(() => {
    const loadPets = async () => {
      try {
        const res = await petApi.getAllPets();
        const payload = res?.data ?? res;
        const data = payload?.result ?? payload ?? [];
        setPets(Array.isArray(data) ? data : data.content || []);
      } catch (e) {
        setPets([]);
      }
    };
    loadPets();
  }, []);

  // debounce the code input so typing doesn't fire too many requests
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(code), 300);
    return () => clearTimeout(t);
  }, [code]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params: any = { pageNumber: page, size };
        if (status) params.status = status;
        if (debouncedCode) params.code = debouncedCode;
        if (petId) params.petId = Number(petId);
        const res = await adoptApi.getAllAdopts(params);

        // Normalize response shape: prefer res.data.result, then res.data, then res
        const payload = res?.data ?? res;
        const data = payload?.result ?? payload ?? [];

        if (!data) {
          setList([]);
          setTotalPages(0);
          setTotalElements(0);
        } else if (Array.isArray(data)) {
          setList(data);
          setTotalPages(1);
          setTotalElements(data.length);
        } else {
          setList(data.content || []);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
        }
      } catch (err) {
        console.error('Failed to load adopts', err);
        setList([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, size, status, debouncedCode, petId]);

  const statusMap: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    APPROVED: "Đã duyệt",
    REJECTED: "Bị từ chối",
    COMPLETED: "Hoàn thành",
    CANCELED: "Đã hủy"
  };

  const getStatusLabel = (val: string) => {
    if (!val) return "";
    return statusMap[val] || val;
  };

  return (
    <div className="adopt-page">
      <h1 className="adopt-header">Nhận nuôi thú cưng</h1>

      <div className="adopt-panel">
        <div className="adopt-grid">
          <div>
            <label className="form-label">Trạng thái</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tất cả</option>
              {Object.entries(statusMap).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Thú cưng</label>
            <select className="form-select" value={petId} onChange={(e) => setPetId(e.target.value)}>
              <option value="">Tất cả</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name || `#${p.id}`}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Tìm kiếm mã</label>
            <input className="form-control" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Mã đơn..." />
          </div>

          <div className="flex items-end">
            {/* removed explicit filter button - inputs auto-trigger requests */}
          </div>
        </div>
      </div>

      <div className="adopt-panel">
        {loading ? (
          <div className="adopt-empty">Đang tải...</div>
        ) : (
          <table className="adopt-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Thú cưng</th>
                <th>Ngày</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={6} className="adopt-empty">Không có dữ liệu</td></tr>
              )}
              {list.map((r: any) => (
                <tr key={r.id} className="adopt-card-row">
                  <td>{r.code}</td>
                  <td>
                    {(() => {
                      if (r.pet?.name) return r.pet.name;
                      if (r.petName) return r.petName;
                      const id = r.petId ?? r.pet?.id;
                      const found = pets.find((p) => String(p.id) === String(id));
                      return found?.name || (id ? `#${id}` : '—');
                    })()}
                  </td>
                  <td>{r.createdDate ? new Date(r.createdDate).toLocaleDateString('vi-VN') : ''}</td>
                  <td>{getStatusLabel(r.status)}</td>
                  <td>{r.note}</td>
                  <td><Link to={`/adopt/${r.id}`} className="btn-link">Xem chi tiết</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination controls */}
      {totalPages > 0 && (
        <div className="adopt-panel flex items-center justify-between p-4">
          <div className="text-sm text-gray-600">
             Hiển thị {list.length} trên {totalElements} kết quả
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
                className={`w-9 h-9 flex items-center justify-center border rounded-lg ${
                  page <= 1
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
                  const active = p === page;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
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
                  const target = page + 1;
                  if (totalPages && target > totalPages) return;
                  setPage(target);
                }}
                disabled={totalPages ? page >= totalPages : false}
                aria-label="Next page"
                className={`w-9 h-9 flex items-center justify-center border rounded-lg ${
                  totalPages && page >= totalPages
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
      )}
    </div>
  );
}
