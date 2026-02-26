import React, { useState } from 'react';
import FireEquipmentForm from './FireEquipmentForm';

interface FireEquipmentCardProps {
  equipment: any;
  onUpdate: (data: any) => void;
  onDelete: () => void;
}

const FireEquipmentCard: React.FC<FireEquipmentCardProps> = ({ 
  equipment, 
  onUpdate, 
  onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'в експлуатації': return '#4CAF50';
      case 'закрито': return '#f44336';
      case 'на обслуговуванні': return '#ff9800';
      default: return '#999';
    }
  };

  if (isEditing) {
    return (
      <FireEquipmentForm 
        initialData={equipment}
        onSubmit={(data) => {
          onUpdate(data);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="property-card">
      <div className="card-header" style={{ background: `linear-gradient(135deg, #ff6f00 0%, ${getStatusColor(equipment.status)} 100%)` }}>
        <div>
          <h2>🚒 {equipment.type}</h2>
          <p className="subtitle">{equipment.location}</p>
        </div>
        <div className="card-actions">
          <button 
            className="btn-icon edit"
            onClick={() => setIsEditing(true)}
            title="Редагувати"
          >
            ✏️
          </button>
          <button 
            className="btn-icon delete"
            onClick={() => {
              if (window.confirm('Видалити обладнання?')) {
                onDelete();
              }
            }}
            title="Видалити"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="card-sections">
        <section className="card-section">
          <h3>📋 Основна інформація</h3>
          <div className="info-grid">
            <div className="info-row">
              <span className="label">Статус:</span>
              <span className="value" style={{ color: getStatusColor(equipment.status), fontWeight: 'bold' }}>
                {equipment.status}
              </span>
            </div>
            {equipment.serialNumber && (
              <div className="info-row">
                <span className="label">Серійний номер:</span>
                <span className="value">{equipment.serialNumber}</span>
              </div>
            )}
            {equipment.manufacturer && (
              <div className="info-row">
                <span className="label">Виробник:</span>
                <span className="value">{equipment.manufacturer}</span>
              </div>
            )}
          </div>
        </section>

        <section className="card-section">
          <h3>📅 Дати обслуговування</h3>
          <div className="info-grid">
            {equipment.installationDate && (
              <div className="info-row">
                <span className="label">Дата встановлення:</span>
                <span className="value">{new Date(equipment.installationDate).toLocaleDateString()}</span>
              </div>
            )}
            {equipment.lastInspectionDate && (
              <div className="info-row">
                <span className="label">Остання перевірка:</span>
                <span className="value">{new Date(equipment.lastInspectionDate).toLocaleDateString()}</span>
              </div>
            )}
            {equipment.nextInspectionDate && (
              <div className="info-row">
                <span className="label">Наступна перевірка:</span>
                <span className="value">{new Date(equipment.nextInspectionDate).toLocaleDateString()}</span>
              </div>
            )}
            {equipment.inspectionCertificate && (
              <div className="info-row">
                <span className="label">Сертифікат:</span>
                <span className="value act-badge primary">{equipment.inspectionCertificate}</span>
              </div>
            )}
          </div>
        </section>

        {equipment.notes && (
          <section className="card-section">
            <h3>📝 Примітки</h3>
            <p className="notes">{equipment.notes}</p>
          </section>
        )}
      </div>
    </div>
  );
};

export default FireEquipmentCard;