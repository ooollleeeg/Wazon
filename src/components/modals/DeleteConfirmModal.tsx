// import React from 'react';
import './styles/DeleteConfirmModal.css';

interface DeleteConfirmModalProps {
  fullName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DeleteConfirmModal({
  fullName,
  onConfirm,
  onCancel,
  isLoading,
}: DeleteConfirmModalProps) {
  return (
    <div className='modal-overlay' onClick={onCancel}>
      <div className='modal-content' onClick={(e) => e.stopPropagation()}>
        <div className='modal-header'>
          <h3>Видалення запису</h3>
          <button className='modal-close' onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className='modal-body'>
          <p className='warning-icon'>⚠️</p>
          <p className='warning-text'>
            Зараз усі дані про <strong>{fullName}</strong> будуть видалені.
          </p>
          <p className='warning-subtext'>
            Після видалення цю інформацію неможливо буде відновити
          </p>
        </div>

        <div className='modal-actions'>
          <button
            className='btn-cancel'
            onClick={onCancel}
            disabled={isLoading}
          >
            Ні, залишити
          </button>
          <button
            className='btn-delete'
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Видалення...' : 'Так, видалити'}
          </button>
        </div>
      </div>
    </div>
  );
}
