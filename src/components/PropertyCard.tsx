import React, { useState } from 'react';
import '../styles/PropertyCard.css';
import PropertyForm from './PropertyForm';

interface PropertyCardProps {
  property: any;
  onUpdate: (data: any) => void;
  onDelete: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ 
  property, 
  onUpdate, 
  onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <PropertyForm 
        initialData={property}
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
      <div className="card-header">
        <h2>{property.address}</h2>
        <div className="card-actions">
          <button 
            className="btn-icon edit"
            onClick={() => setIsEditing(true)}
            title="Редактировать"
          >
            ✏️
          </button>
          <button 
            className="btn-icon delete"
            onClick={() => {
              if (window.confirm('Удалить объект?')) {
                onDelete();
              }
            }}
            title="Удалить"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="card-sections">
        <section className="card-section">
          <h3>📍 Основная информация</h3>
          <div className="info-grid">
            {property.officeNumber && (
              <div className="info-row">
                <span className="label">Номер кабинета:</span>
                <span className="value">{property.officeNumber}</span>
              </div>
            )}
            {property.buildingType && (
              <div className="info-row">
                <span className="label">Тип здания:</span>
                <span className="value">{property.buildingType}</span>
              </div>
            )}
            {property.area && (
              <div className="info-row">
                <span className="label">Площадь:</span>
                <span className="value">{property.area} м²</span>
              </div>
            )}
            {property.yearBuilt && (
              <div className="info-row">
                <span className="label">Год постройки:</span>
                <span className="value">{property.yearBuilt}</span>
              </div>
            )}
          </div>
        </section>

        <section className="card-section">
          <h3>📄 Документация</h3>
          <div className="info-grid">
            {property.inspectionActNumbers && (
              <div className="info-row">
                <span className="label">Акты обследования:</span>
                <span className="value acts">
                  {property.inspectionActNumbers.split(',').map((act, i) => (
                    <span key={i} className="act-badge">{act.trim()}</span>
                  ))}
                </span>
              </div>
            )}
            {property.categorizationActNumber && (
              <div className="info-row">
                <span className="label">Акт категорирования:</span>
                <span className="value act-badge primary">
                  {property.categorizationActNumber}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="card-section">
          <h3>👤 Контактная информация</h3>
          <div className="info-grid">
            {property.ownerName && (
              <div className="info-row">
                <span className="label">Владелец:</span>
                <span className="value">{property.ownerName}</span>
              </div>
            )}
            {property.contactPhone && (
              <div className="info-row">
                <span className="label">Телефон:</span>
                <span className="value">{property.contactPhone}</span>
              </div>
            )}
          </div>
        </section>

        {property.notes && (
          <section className="card-section">
            <h3>📝 Примечания</h3>
            <p className="notes">{property.notes}</p>
          </section>
        )}

        <section className="card-section meta">
          <small>
            {property.createdAt && `Создано: ${new Date(property.createdAt).toLocaleDateString()}`}
            {property.updatedAt && ` | Обновлено: ${new Date(property.updatedAt).toLocaleDateString()}`}
          </small>
        </section>
      </div>
    </div>
  );
};

export default PropertyCard;