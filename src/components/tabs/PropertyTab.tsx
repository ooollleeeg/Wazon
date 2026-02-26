import React, { useState, useEffect } from 'react';
import PropertyList from '../PropertyList';
import PropertyForm from '../PropertyForm';
import PropertyCard from '../PropertyCard';
import '../../styles/TabContent.css';

function PropertyTab() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  const handleAddProperty = async (propertyData) => {
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData),
      });
      const newProperty = await response.json();
      setProperties([...properties, newProperty]);
      setShowForm(false);
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  };

  const handleUpdateProperty = async (id, propertyData) => {
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyData),
      });
      const updated = await response.json();
      setProperties(properties.map(p => p.id === id ? updated : p));
      setSelectedProperty(null);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  const handleDeleteProperty = async (id) => {
    if (window.confirm('Удалить объект?')) {
      try {
        await fetch(`/api/properties/${id}`, { method: 'DELETE' });
        setProperties(properties.filter(p => p.id !== id));
        setSelectedProperty(null);
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
          {showForm ? '✕ Отменить' : '+ Добавить объект'}
        </button>
        <PropertyList 
          properties={properties}
          selectedProperty={selectedProperty}
          onSelectProperty={setSelectedProperty}
        />
      </aside>

      <main className="tab-main">
        {showForm ? (
          <PropertyForm 
            onSubmit={handleAddProperty}
            onCancel={() => setShowForm(false)}
          />
        ) : selectedProperty ? (
          <PropertyCard 
            property={selectedProperty}
            onUpdate={(data) => handleUpdateProperty(selectedProperty.id, data)}
            onDelete={() => handleDeleteProperty(selectedProperty.id)}
          />
        ) : (
          <div className="empty-state">
            <p>Выберите объект из списка или добавьте новый</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default PropertyTab;