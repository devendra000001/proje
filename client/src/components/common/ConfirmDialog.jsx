import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertCircle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-full shrink-0 ${isDanger ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-stone-700 mb-6">{message}</p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
              {cancelText}
            </Button>
            <Button
              variant={isDanger ? 'danger' : 'primary'}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
