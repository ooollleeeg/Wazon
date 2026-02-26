import React, { useState } from 'react';
import '../styles/PropertyList.css';

interface PropertyListProps {
  properties: any[];
  selectedProperty: any;
  onSelectProperty: (property: any) => void;
}

const PropertyList: React.FC<PropertyListProps> = ({ 
  properties, 
  selectedProperty, 
  onSelectProperty 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = properties.filter(prop =>
    prop.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.officeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.categorizationActNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="property-list">
      <div className="search-box">
        <input
          type="text"
          placeholder="🔍 Поиск по адресу, кабинету..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="property-items">
        {filtered.length === 0 ? (
          <p className="empty">Объектов не найдено</p>
        ) : (
          filtered.map(property => (
            <div
              key={property.id}
              className={`property-item ${selectedProperty?.id === property.id ? 'active' : ''}`}
              onClick={() => onSelectProperty(property)}
            >
              <div className="item-address">{property.address}</div>
              <div className="item-meta">
                {property.officeNumber && <span className="badge">{property.officeNumber}</span>}
                {property.categorizationActNumber && (
                  <span className="badge act">{property.categorizationActNumber}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="list-footer">
        <small>Всего объектов: {properties.length}</small>
      </div>
    </div>
  );
};

export default PropertyList;