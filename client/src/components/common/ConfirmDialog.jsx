import React from 'react';
import { AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/helpers';
import Modal from './Modal';
import Button from './Button';

/**
 * ConfirmDialog Component
 * 
 * @param {boolean} isOpen - Whether the dialog is visible
 * @param {function} onClose - Function to call on cancel/close
 * @param {function} onConfirm - Function to call on confirm
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message content
 * @param {string} type - info, success, warning, danger
 * @param {string} confirmText - Label for confirm button
 * @param {string} cancelText - Label for cancel button
 * @param {boolean} isLoading - Loading state for confirm button
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation',
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false
}) => {
  const icons = {
    info: <Info className="w-10 h-10 text-blue-500" />,
    success: <CheckCircle2 className="w-10 h-10 text-emerald-500" />,
    warning: <AlertTriangle className="w-10 h-10 text-amber-500" />,
    danger: <AlertCircle className="w-10 h-10 text-rose-500" />
  };

  const confirmVariants = {
    info: 'primary',
    success: 'success',
    warning: 'warning',
    danger: 'danger'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showClose={!isLoading}
      closeOnOverlayClick={!isLoading}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4">
          {icons[type] || icons.warning}
        </div>
        
        <p className="text-slate-600 dark:text-slate-400 mb-8 whitespace-pre-wrap">
          {message}
        </p>

        <div className="flex items-center gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariants[type] || 'primary'}
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
