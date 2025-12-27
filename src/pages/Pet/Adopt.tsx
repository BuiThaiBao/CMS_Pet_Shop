import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import adoptApi from '../../services/api/adoptApi';
import petApi from '../../services/api/petApi';
import './Adopt.css';

export default function Adopt() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [petId, setPetId] = useState('');
  const [code, setCode] = useState('');
  const [debouncedCode, setDebouncedCode] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
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
        const params: any = { page: page - 1, size };
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
        } else if (Array.isArray(data)) {
          setList(data);
          setTotalPages(1);
        } else {
          setList(data.content || []);
          setTotalPages(data.totalPages || 0);
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

  return (
    <div className="adopt-page">
      <h1 className="adopt-header">Adopts</h1>

      <div className="adopt-panel">
        <div className="adopt-grid">
          <div>
            <label className="form-label">Trạng thái</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELED">CANCELED</option>
            </select>
          </div>

          <div>
            <label className="form-label">Pet</label>
            <select className="form-select" value={petId} onChange={(e) => setPetId(e.target.value)}>
              <option value="">All</option>
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
          <div className="adopt-empty">Loading...</div>
        ) : (
          <table className="adopt-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Pet</th>
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
                  <td>{r.status}</td>
                  <td>{r.note}</td>
                  <td><Link to={`/adopt/${r.id}`} className="btn-link">Xem chi tiết</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="adopt-panel adopt-pagination">
          <div className="d-flex justify-content-between align-items-center">
            <div>Trang {page} / {totalPages} — Tổng {totalPages * size} trang</div>
            <div className="d-flex gap-2 align-items-center">
              <button className="btn btn-sm btn-outline-primary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pn) => (
                <button key={pn} className={`btn btn-sm ${pn === page ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPage(pn)}>{pn}</button>
              ))}
              <button className="btn btn-sm btn-outline-primary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
              <select className="form-select form-select-sm ms-2" style={{ width: 80 }} value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
