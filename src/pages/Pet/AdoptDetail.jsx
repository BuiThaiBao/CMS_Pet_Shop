import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adoptApi from '../../services/api/adoptApi';
import http from '../../services/api/http';
import './AdoptDetail.css';
import ConfirmModal from '../../components/common/ConfirmModal';
import Alert from '../../components/ui/alert/Alert';

export default function AdoptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [adopt, setAdopt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [toast, setToast] = useState(null);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

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

    setUpdating(true);
    try {
      if (typeof adoptApi.updateStautusAdopt === 'function') {
        await adoptApi.updateStautusAdopt(adopt.adoptId, newStatus);
      } else if (typeof adoptApi.updateStatusAdopt === 'function') {
        await adoptApi.updateStatusAdopt(adopt.adoptId, newStatus);
      } else {
        throw new Error('API method to update adopt status not found');
      }
      await fetchDetail(adopt.adoptId);
      setToast({ variant: 'success', title: 'Thành công', message: 'Cập nhật trạng thái thành công' });
    } catch (err) {
      console.error('Update status error', err, err?.response?.data);
      const statusCode = err?.response?.status;
      if (statusCode === 400) {
        try {
          const url = `/adopt/status/${adopt.adoptId}`;
          await http.put(url, { status: newStatus, adoptId: adopt.adoptId });
          await fetchDetail(adopt.adoptId);
          setToast({ variant: 'success', title: 'Thành công', message: 'Cập nhật trạng thái thành công' });
          setUpdating(false);
          return;
        } catch (e2) {
          console.warn('Fallback r1 failed', e2, e2?.response?.data);
        }

        try {
          await http.put('/adopt/status', { id: adopt.adoptId, status: newStatus });
          await fetchDetail(adopt.adoptId);
          setToast({ variant: 'success', title: 'Thành công', message: 'Cập nhật trạng thái thành công' });
          setUpdating(false);
          return;
        } catch (e3) {
          console.warn('Fallback r2 failed', e3, e3?.response?.data);
        }
      }

      setToast({ 
        variant: 'error', 
        title: 'Lỗi', 
        message: err?.response?.data?.message || err?.message || 'Cập nhật thất bại' 
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'Đang chờ duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Đã từ chối',
      COMPLETED: 'Hoàn thành',
      CANCELED: 'Đã hủy',
    };
    return labels[status] || status;
  };

  const getAnimalLabel = (val) => {
    const map = {
      dog: "Chó",
      cat: "Mèo",
      bird: "Chim",
      rabbit: "Thỏ",
      other: "Khác"
    };
    return map[String(val).toLowerCase()] || val;
  };

  const getGenderLabel = (val) => {
    const map = {
      male: "Đực",
      female: "Cái",
      other: "Khác"
    };
    return map[String(val).toLowerCase()] || val;
  };

  const getGenderClass = (gender) => {
    const g = String(gender).toLowerCase();
    if (g.includes('đực') || g.includes('male')) return 'gender-male';
    if (g.includes('cái') || g.includes('female')) return 'gender-female';
    return '';
  };

  if (loading) {
    return (
      <div className="adopt-detail-root">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Đang tải thông tin...</div>
        </div>
      </div>
    );
  }

  if (!adopt) {
    return (
      <div className="adopt-detail-root">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-text">Không tìm thấy đơn nhận nuôi.</div>
        </div>
      </div>
    );
  }

  const status = String(adopt.status || '');
  const noActions = ['REJECTED', 'CANCELED', 'COMPLETED'].includes(status);

  return (
    <div className="adopt-detail-root">
      {toast && (
        <div className="fixed right-4 top-24 z-[9999] w-96">
          <Alert variant={toast.variant === "error" ? "error" : "success"} title={toast.title} message={toast.message} />
        </div>
      )}
      <div className="adopt-detail-wrap">
        <div className="adopt-detail-header">
          <button className="btn btn-back" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
          <h2>Chi tiết đơn nhận nuôi</h2>
        </div>

        <div className="adopt-detail-card">
          {/* PET INFO SECTION */}
          <div className="pet-info-section">
            <div className="pet-image-wrapper">
              {adopt.pet?.image && (
                <img src={adopt.pet.image} alt={adopt.pet?.name || 'Pet'} />
              )}
            </div>

            <div className="pet-info-content">
              <h3>{adopt.pet?.name || 'Chưa có tên'}</h3>
              <div className="pet-meta">
                {adopt.pet?.animal && (
                  <span className="pet-tag">🐾 {getAnimalLabel(adopt.pet.animal)}</span>
                )}
                {adopt.pet?.breed && (
                  <span className="pet-tag">🏷️ {adopt.pet.breed}</span>
                )}
                {adopt.pet?.age && (
                  <span className="pet-tag">📅 {adopt.pet.age} tuổi</span>
                )}
                {adopt.pet?.gender && (
                  <span className={`pet-tag ${getGenderClass(adopt.pet.gender)}`}>
                    {adopt.pet.gender.toLowerCase().includes('đực') || adopt.pet.gender.toLowerCase().includes('male') ? '♂️' : '♀️'} {getGenderLabel(adopt.pet.gender)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* APPLICANT INFO SECTION */}
          <div className="applicant-section">
            <h4 className="section-title">Thông tin người đăng ký</h4>
            <div className="applicant-grid">
              <div className="info-item">
                <span className="label">Họ và tên</span>
                <span className="value">{adopt.applicant?.fullName || '—'}</span>
              </div>
              <div className="info-item">
                <span className="label">Số điện thoại</span>
                <span className="value">{adopt.applicant?.phone || '—'}</span>
              </div>
              <div className="info-item">
                <span className="label">Địa chỉ</span>
                <span className="value">{adopt.applicant?.address || '—'}</span>
              </div>
              <div className="info-item">
                <span className="label">Nghề nghiệp</span>
                <span className="value">{adopt.job || '—'}</span>
              </div>
              <div className="info-item">
                <span className="label">Thu nhập</span>
                <span className="value">{adopt.income || '—'}</span>
              </div>
              <div className="info-item">
                <span className="label">Điều kiện sống</span>
                <span className="value">{adopt.liveCondition || '—'}</span>
              </div>
            </div>
          </div>

          {/* NOTE SECTION */}
          {adopt.note && (
            <div className="note-section">
              <h4 className="section-title">Ghi chú</h4>
              <div className="note-content">{adopt.note}</div>
            </div>
          )}

          {/* STATUS SECTION */}
          <div className="status-section">
            <strong>Trạng thái:</strong>
            <span className={`status-badge ${status.toLowerCase()}`}>
              {getStatusLabel(status)}
            </span>
          </div>

          {/* ACTIONS SECTION */}
          <div className="adopt-detail-actions">
            {status === 'PENDING' && (
              <>
                <button
                  className="btn btn-approve"
                  disabled={updating}
                  onClick={() => { setConfirmAction('APPROVED'); setConfirmOpen(true); }}
                >
                  ✓ Duyệt đơn
                </button>

                <button
                  className="btn btn-reject"
                  disabled={updating}
                  onClick={() => { setConfirmAction('REJECTED'); setConfirmOpen(true); }}
                >
                  ✕ Từ chối
                </button>
              </>
            )}

            {status === 'APPROVED' && (
              <button
                className="btn btn-select"
                disabled={updating}
                onClick={() => { setConfirmAction('COMPLETED'); setConfirmOpen(true); }}
              >
                ✓ Chấp nhận người nhận nuôi
              </button>
            )}

            {noActions && (
              <div style={{ color: 'var(--adopt-muted)', fontStyle: 'italic', fontSize: '14px' }}>
                Đơn này đã được xử lý xong.
              </div>
            )}
          </div>
        </div>

        <ConfirmModal
          isOpen={confirmOpen}
          title={
            confirmAction === 'APPROVED'
              ? 'Xác nhận duyệt đơn'
              : confirmAction === 'REJECTED'
                ? 'Xác nhận từ chối đơn'
                : 'Xác nhận chấp nhận người nhận nuôi'
          }
          message={
            confirmAction === 'APPROVED'
              ? 'Bạn có chắc muốn duyệt đơn nhận nuôi này không?'
              : confirmAction === 'REJECTED'
                ? 'Bạn có chắc muốn từ chối đơn nhận nuôi này không?'
                : 'Bạn có chắc muốn chấp nhận người nhận nuôi này không?'
          }
          onClose={() => { setConfirmOpen(false); setConfirmAction(null); }}
          onConfirm={async () => {
            if (!confirmAction) return;
            await updateStatus(confirmAction);
            setConfirmOpen(false);
            setConfirmAction(null);
          }}
          confirmLabel={
            confirmAction === 'REJECTED'
              ? 'Từ chối'
              : confirmAction === 'APPROVED'
                ? 'Duyệt'
                : 'Chấp nhận'
          }
          loading={updating}
        />
      </div>
    </div>
  );
}
