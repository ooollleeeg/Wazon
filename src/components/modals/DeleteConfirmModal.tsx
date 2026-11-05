// import React from 'react';
import type { ReactNode } from 'react';
import './styles/DeleteConfirmModal.css';

interface DeleteConfirmModalProps {
  fullName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
  message?: ReactNode;
  subtext?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function DeleteConfirmModal({
  fullName,
  onConfirm,
  onCancel,
  isLoading,
  title = 'Видалення запису',
  message,
  subtext = 'Після видалення цю інформацію неможливо буде відновити',
  confirmLabel = 'Так, видалити',
  cancelLabel = 'Ні, залишити',
}: DeleteConfirmModalProps) {
  return (
    <div className='modal-overlay' onClick={onCancel}>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <div className='modal-header'>
          <h3>{title}</h3>
          <button className='modal-close' onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className='modal-body'>
          <p className='warning-icon'>⚠️</p>
          <p className='warning-text'>
            {message ?? (
              <>
                Зараз усі дані про <strong>{fullName}</strong> будуть видалені.
              </>
            )}
          </p>
          {subtext && <p className='warning-subtext'>{subtext}</p>}
        </div>

        <div className='modal-actions'>
          <button
            className='btn-cancel'
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            className='btn-delete'
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Виконується...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
