import React from 'react';
import './styles/SuccessModal.css';

interface SuccessModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  message,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className='success-modal-overlay' onClick={onClose}>
      <div className='success-modal' onClick={(e) => e.stopPropagation()}>
        <div className='success-modal-content'>
          <div className='success-modal-icon'>✅</div>
          <h3>{message}</h3>
        </div>
        <div className='success-modal-footer'>
          <button className='success-modal-btn-ok' onClick={onClose}>
            ОК
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
