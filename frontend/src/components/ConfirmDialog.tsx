import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm flex flex-col gap-4 border border-red-200">
        <h3 className="text-xl font-bold mb-2 text-red-700">{title}</h3>
        <div className="text-gray-700 mb-4">{message}</div>
        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 bg-red-600 text-white font-semibold py-2 rounded hover:bg-red-700 transition"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : confirmLabel}
          </button>
          <button
            className="flex-1 bg-gray-100 text-red-700 font-semibold py-2 rounded hover:bg-gray-200 transition"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
