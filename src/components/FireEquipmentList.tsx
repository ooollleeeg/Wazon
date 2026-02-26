import React, { useState } from 'react';

interface FireEquipmentListProps {
  equipment: any[];
  selectedEquipment: any;
  onSelectEquipment: (equipment: any) => void;
}

const FireEquipmentList: React.FC<FireEquipmentListProps> = ({ 
  equipment, 
  selectedEquipment, 
  onSelectEquipment 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = equipment.filter(item =>
    item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'в експлуатації': return '✓';
      case 'закрито': return '✕';
      case 'на обслуговуванні': return '⚙️';
      default: return '?';
    }
  };

  return (
    <div className="property-list">
      <div className="search-box">
        <input
          type="text"
          placeholder="🔍 Пошук..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="property-items">
        {filtered.length === 0 ? (
          <p className="empty">Обладнання не знайдено</p>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className={`property-item ${selectedEquipment?.id === item.id ? 'active' : ''}`}
              onClick={() => onSelectEquipment(item)}
            >
              <div className="item-address">🚒 {item.type}</div>
              <div className="item-meta">
                <span className="badge">{item.location}</span>
                <span className="badge status">{getStatusIcon(item.status)} {item.status}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="list-footer">
        <small>Всього: {equipment.length}</small>
      </div>
    </div>
  );
};

export default FireEquipmentList;