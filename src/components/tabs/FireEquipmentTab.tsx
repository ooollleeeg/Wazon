import React, { useState, useEffect } from 'react';
import FireEquipmentList from '../FireEquipmentList';
import FireEquipmentForm from '../FireEquipmentForm';
import FireEquipmentCard from '../FireEquipmentCard';
import '../../styles/TabContent.css';

function FireEquipmentTab() {
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/fire-equipment');
      const data = await response.json();
      setEquipment(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  const handleAddEquipment = async (equipmentData) => {
    try {
      const response = await fetch('/api/fire-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipmentData),
      });
      const newEquipment = await response.json();
      setEquipment([...equipment, newEquipment]);
      setShowForm(false);
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  };

  const handleUpdateEquipment = async (id, equipmentData) => {
    try {
      const response = await fetch(`/api/fire-equipment/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipmentData),
      });
      const updated = await response.json();
      setEquipment(equipment.map(e => e.id === id ? updated : e));
      setSelectedEquipment(null);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  const handleDeleteEquipment = async (id) => {
    if (window.confirm('Удалить оборудование?')) {
      try {
        await fetch(`/api/fire-equipment/${id}`, { method: 'DELETE' });
        setEquipment(equipment.filter(e => e.id !== id));
        setSelectedEquipment(null);
      } catch (error) {
        console.error('Ошибка удаления:', error);
      }
    }
  };

  return (
    <div className="tab-layout">
      <aside className="tab-sidebar">
        <button 
          className="btn-add"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Отменить' : '+ Добавить оборудование'}
        </button>
        <FireEquipmentList 
          equipment={equipment}
          selectedEquipment={selectedEquipment}
          onSelectEquipment={setSelectedEquipment}
        />
      </aside>

      <main className="tab-main">
        {showForm ? (
          <FireEquipmentForm 
            onSubmit={handleAddEquipment}
            onCancel={() => setShowForm(false)}
          />
        ) : selectedEquipment ? (
          <FireEquipmentCard 
            equipment={selectedEquipment}
            onUpdate={(data) => handleUpdateEquipment(selectedEquipment.id, data)}
            onDelete={() => handleDeleteEquipment(selectedEquipment.id)}
          />
        ) : (
          <div className="empty-state">
            <p>Выберите оборудование из списка или добавьте новое</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default FireEquipmentTab;