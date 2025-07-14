import React from 'react';
import '../styles/ConfirmDialog.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  type = 'danger'
}) => {
  if (!open) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          headerBg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          icon: '⚠️',
          confirmBg: 'var(--phub-error)',
          confirmHoverBg: '#b91c1c'
        };
      case 'warning':
        return {
          headerBg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          icon: '⚡',
          confirmBg: 'var(--phub-warning)',
          confirmHoverBg: '#b45309'
        };
      case 'info':
        return {
          headerBg: 'linear-gradient(135deg, var(--phub-primary) 0%, var(--phub-secondary) 100%)',
          icon: 'ℹ️',
          confirmBg: 'var(--phub-primary)',
          confirmHoverBg: 'var(--phub-primary-dark)'
        };
      default:
        return {
          headerBg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          icon: '⚠️',
          confirmBg: 'var(--phub-error)',
          confirmHoverBg: '#b91c1c'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div className="phub-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="phub-form-container" style={{ maxWidth: '28rem' }}>
        {/* Floating decorative elements */}
        <div className="phub-floating-elements">
          <div className="phub-floating-circle"></div>
          <div className="phub-floating-circle"></div>
        </div>

        {/* Header */}
        <div 
          className="phub-form-header"
          style={{ background: typeStyles.headerBg }}
        >
          <h2 className="phub-form-title" style={{ fontSize: '1.5rem' }}>
            <span style={{ marginRight: 'var(--phub-space-sm)' }}>{typeStyles.icon}</span>
            {title}
          </h2>
        </div>

        <div className="phub-form-body">
          {/* Message */}
          <div style={{
            fontSize: '1rem',
            lineHeight: '1.6',
            color: 'var(--phub-gray-700)',
            textAlign: 'center',
            padding: 'var(--phub-space-md) 0'
          }}>
            {message}
          </div>

          {/* Visual emphasis for danger actions */}
          {type === 'danger' && (
            <div style={{
              background: 'rgba(220, 38, 38, 0.05)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              borderRadius: 'var(--phub-radius-lg)',
              padding: 'var(--phub-space-md)',
              marginTop: 'var(--phub-space-md)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'var(--phub-error)',
                fontWeight: '600',
                marginBottom: 'var(--phub-space-xs)'
              }}>
                🛑 This action cannot be undone
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--phub-gray-600)'
              }}>
                Please make sure you want to proceed
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="phub-form-actions">
          <button
            type="button"
            className="phub-btn secondary"
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1 }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`phub-btn ${loading ? 'phub-loading' : ''}`}
            onClick={onConfirm}
            disabled={loading}
            style={{ 
              flex: 1,
              background: typeStyles.confirmBg,
              color: 'white',
              boxShadow: 'var(--phub-shadow-md)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = typeStyles.confirmHoverBg;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = typeStyles.confirmBg;
              }
            }}
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                Processing...
              </>
            ) : (
              <>
                <span>{type === 'danger' ? '🗑️' : type === 'warning' ? '⚡' : '✅'}</span>
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
