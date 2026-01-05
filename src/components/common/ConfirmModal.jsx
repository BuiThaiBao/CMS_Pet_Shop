import React, { useEffect } from 'react';

const ConfirmModal = ({ isOpen, title = 'Xác nhận', message, onClose, onConfirm, confirmLabel = 'Xác nhận', loading = false }) => {
  useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} onClick={onClose}></div>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1055,
          padding: 20
        }}
        onClick={onClose}
      >
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 600 }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.12)', padding: '36px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, color: '#f7c948' }}>⚠️</div>
            <h5 className="mt-3 mb-2">{title}</h5>
            {message && <div className="text-muted mb-3">{message}</div>}

            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
              <button type="button" className="btn btn-link text-muted" onClick={onClose} disabled={loading} style={{ fontSize: 16 }}>
                Hủy
              </button>
              <button type="button" className="btn" onClick={onConfirm} disabled={loading} style={{ background: '#ff6b7a', color: '#fff', paddingLeft: 30, paddingRight: 30, borderRadius: 30 }}>
                {loading ? 'Đang...' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;
