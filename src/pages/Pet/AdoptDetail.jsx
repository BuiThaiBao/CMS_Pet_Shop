import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adoptApi from '../../services/api/adoptApi';
import http from '../../services/api/http';
import './AdoptDetail.css';

export default function AdoptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [adopt, setAdopt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchDetail = async (adoptId) => {
    if (!adoptId) return;
    setLoading(true);
    try {
      const res = await adoptApi.getAdoptDetail(Number(adoptId));
      const payload = res?.data || res;
      const data = payload?.result || payload || null;

      if (data) {
        setAdopt({
          adoptId: data.adoptId ?? data.id ?? null,
          code: data.code,
          status: data.status,
          note: data.note,
          job: data.job || data.profession || '',
          income: data.income || '',
          isOwnPet: data.isOwnPet ?? '',
          liveCondition: data.liveCondition || '',
          createdDate: data.createdDate || data.createdAt || '',
          pet: data.pet || null,
          applicant: data.applicant || null,
        });
      } else {
        setAdopt(null);
      }
    } catch (err) {
      console.error(err);
      setAdopt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail(id);
  }, [id]);

  const updateStatus = async (newStatus) => {
    if (!adopt?.adoptId) return;
    if(newStatus === "APPROVED") {
      if (!window.confirm(`Bạn có chắc muốn duyệt đơn nhận nuôi này không?`)) return;
    }
    else if (newStatus === "REJECTED") {
      if (!window.confirm(`Bạn có chắc muốn từ chối đơn nhận nuôi này không?`)) return;
    }
    else if( newStatus === "COMPLETED") {
      if (!window.confirm(`Bạn có chắc muốn chấp nhận người nhận nuôi này không?`)) return;
    }

    setUpdating(true);
    try {
      // correct API method name (adoptApi uses updateStautusAdopt)
      if (typeof adoptApi.updateStautusAdopt === 'function') {
        await adoptApi.updateStautusAdopt(adopt.adoptId, newStatus);
      } else if (typeof adoptApi.updateStatusAdopt === 'function') {
        await adoptApi.updateStatusAdopt(adopt.adoptId, newStatus);
      } else {
        throw new Error('API method to update adopt status not found');
      }
      await fetchDetail(adopt.adoptId);
      alert('Cập nhật trạng thái thành công');
    } catch (err) {
      console.error('Update status error', err, err?.response?.data);
      // if server returned 400 (Bad Request) try fallback payloads
      const statusCode = err?.response?.status;
      if (statusCode === 400) {
        try {
          console.log('Retrying with fallback body {status, adoptId}');
          const url = `/adopt/status/${adopt.adoptId}`;
          const r1 = await http.put(url, { status: newStatus, adoptId: adopt.adoptId });
          console.log('Fallback r1 success', r1);
          await fetchDetail(adopt.adoptId);
          alert('Cập nhật trạng thái thành công (fallback)');
          setUpdating(false);
          return;
        } catch (e2) {
          console.warn('Fallback r1 failed', e2, e2?.response?.data);
        }

        try {
          console.log('Retrying with alternate endpoint /adopt/status (body: {id, status})');
          const r2 = await http.put('/adopt/status', { id: adopt.adoptId, status: newStatus });
          console.log('Fallback r2 success', r2);
          await fetchDetail(adopt.adoptId);
          alert('Cập nhật trạng thái thành công (fallback2)');
          setUpdating(false);
          return;
        } catch (e3) {
          console.warn('Fallback r2 failed', e3, e3?.response?.data);
        }
      }

      alert(err?.response?.data?.message || err?.message || 'Cập nhật thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const acceptAdopter = async () => {
    // when accepting adopter, set status to COMPLETED
    if (!adopt || !adopt.adoptId) return;
    await updateStatus('COMPLETED');
  };

  if (loading) {
    return <div className="adopt-detail-root">Đang tải...</div>;
  }

  if (!adopt) {
    return <div className="adopt-detail-root">Không tìm thấy đơn nhận nuôi.</div>;
  }

  const status = String(adopt.status || '');
  const noActions = ['REJECTED', 'CANCELED', 'COMPLETED'].includes(status);

  return (
    <div className="adopt-detail-root">
      <div className="adopt-detail-wrap">
        <button className="btn btn-back" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>

        <h2>Chi tiết đơn nhận nuôi</h2>

        <div className="adopt-detail-card">
          {/* PET INFO */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 160, height: 120, background: '#eee' }}>
              {adopt.pet?.image && (
                <img
                  src={adopt.pet.image}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>

            <div>
              <h3>{adopt.pet?.name || '—'}</h3>
              <div>{adopt.pet?.animal} · {adopt.pet?.breed}</div>
              <div>{adopt.pet?.age} · {adopt.pet?.gender}</div>
            </div>
          </div>

          {/* APPLICANT INFO */}
          <div style={{ marginTop: 20 }}>
            <h4>Thông tin người đăng ký</h4>
            <div>Họ tên: {adopt.applicant?.fullName || '—'}</div>
            <div>SĐT: {adopt.applicant?.phone || '—'}</div>
            <div>Địa chỉ: {adopt.applicant?.address || '—'}</div>
            <div>Nghề nghiệp: {adopt.job || '—'}</div>
            <div>Thu nhập: {adopt.income || '—'}</div>
            <div>Điều kiện sống: {adopt.liveCondition || '—'}</div>
          </div>

          {/* STATUS */}
          <div style={{ marginTop: 20 }}>
            <strong>Trạng thái:</strong> {status}
          </div>

          {/* ACTIONS */}
          <div className="adopt-detail-actions">
            {status === 'PENDING' && (
              <>
                <button
                  className="btn btn-approve"
                  disabled={updating}
                  onClick={() => updateStatus('APPROVED')}
                >
                  Duyệt
                </button>

                <button
                  className="btn btn-reject"
                  disabled={updating}
                  onClick={() => updateStatus('REJECTED')}
                >
                  Không duyệt
                </button>
              </>
            )}

            {status === 'APPROVED' && (
              <button className="btn btn-select" disabled={updating} onClick={acceptAdopter}>
                Chấp nhận người nhận nuôi
              </button>
            )}

            {noActions && (
              /* no action buttons for REJECTED, CANCELED, COMPLETED */
              null
            )}
          </div>
        </div> {/* adopt-detail-card */}
      </div> {/* adopt-detail-wrap */}
    </div> /* adopt-detail-root */
  );
}
