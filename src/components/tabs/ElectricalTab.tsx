import React, { useState, useEffect } from 'react';
import ElectricalList from '../ElectricalList';
import ElectricalForm from '../ElectricalForm';
import ElectricalCard from '../ElectricalCard';
import '../../styles/TabContent.css';

function ElectricalTab() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/electrical-equipment');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  const handleAddItem = async (itemData) => {
    try {
      const response = await fetch('/api/electrical-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      const newItem = await response.json();
      setItems([...items, newItem]);
      setShowForm(false);
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  };

  const handleUpdateItem = async (id, itemData) => {
    try {
      const response = await fetch(`/api/electrical-equipment/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      const updated = await response.json();
      setItems(items.map(i => i.id === id ? updated : i));
      setSelectedItem(null);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Удалить оборудование?')) {
      try {
        await fetch(`/api/electrical-equipment/${id}`, { method: 'DELETE' });
        setItems(items.filter(i => i.id !== id));
        setSelectedItem(null);
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
        <ElectricalList 
          items={items}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
        />
      </aside>

      <main className="tab-main">
        {showForm ? (
          <ElectricalForm 
            onSubmit={handleAddItem}
            onCancel={() => setShowForm(false)}
          />
        ) : selectedItem ? (
          <ElectricalCard 
            item={selectedItem}
            onUpdate={(data) => handleUpdateItem(selectedItem.id, data)}
            onDelete={() => handleDeleteItem(selectedItem.id)}
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

export default ElectricalTab;