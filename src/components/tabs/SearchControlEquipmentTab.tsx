import React, { useState, useEffect } from 'react';
import '../../styles/TabContent.css';

function SearchControlEquipmentTab() {
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/search-control-equipment');
      const data = await response.json();
      setEquipment(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  const handleAddEquipment = async (data) => {
    try {
      const response = await fetch('/api/search-control-equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newEquipment = await response.json();
      setEquipment([...equipment, newEquipment]);
      setShowForm(false);
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  };

  const handleUpdateEquipment = async (id, data) => {
    try {
      const response = await fetch(`/api/search-control-equipment/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await response.json();
      setEquipment(equipment.map((e) => (e.id === id ? updated : e)));
      setSelectedEquipment(null);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  const handleDeleteEquipment = async (id) => {
    if (window.confirm('Видалити обладнання?')) {
      try {
        await fetch(`/api/search-control-equipment/${id}`, {
          method: 'DELETE',
        });
        setEquipment(equipment.filter((e) => e.id !== id));
        setSelectedEquipment(null);
      } catch (error) {
        console.error('Ошибка удаления:', error);
      }
    }
  };

  return (
    <div className='tab-layout'>
      <aside className='tab-sidebar'>
        <button className='btn-add' onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Отменить' : '+ Додати обладнання'}
        </button>
        <div className='property-list'>
          <div className='search-box'>
            <input type='text' placeholder='🔍 Пошук...' />
          </div>
          <div className='property-items'>
            {equipment.length === 0 ? (
              <p className='empty'>Обладнання не знайдено</p>
            ) : (
              equipment.map((item) => (
                <div
                  key={item.id}
                  className={`property-item ${selectedEquipment?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedEquipment(item)}
                >
                  <div className='item-address'>🔍 {item.name}</div>
                  <div className='item-meta'>
                    <span className='badge'>{item.type}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className='list-footer'>
            <small>Всього: {equipment.length}</small>
          </div>
        </div>
      </aside>

      <main className='tab-main'>
        {showForm ? (
          <form
            className='property-form'
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAddEquipment({
                name: formData.get('name'),
                type: formData.get('type'),
                location: formData.get('location'),
                calibrationDate: formData.get('calibrationDate'),
                notes: formData.get('notes'),
              });
            }}
          >
            <div className='form-section'>
              <h2>🔍 Пошукова та контрольно-вимірювальна техніка</h2>
              <div className='form-group'>
                <label>Назва *</label>
                <input
                  type='text'
                  name='name'
                  placeholder='Назва обладнання'
                  required
                />
              </div>
              <div className='form-row'>
                <div className='form-group'>
                  <label>Тип</label>
                  <input type='text' name='type' placeholder='Тип обладнання' />
                </div>
                <div className='form-group'>
                  <label>Місцеположення</label>
                  <input
                    type='text'
                    name='location'
                    placeholder='Де розташоване'
                  />
                </div>
              </div>
              <div className='form-group'>
                <label>Дата калібрування</label>
                <input type='date' name='calibrationDate' />
              </div>
              <div className='form-group'>
                <label>Примітки</label>
                <textarea
                  name='notes'
                  placeholder='Додаткова інформація...'
                  rows={4}
                ></textarea>
              </div>
            </div>
            <div className='form-actions'>
              <button type='submit' className='btn-primary'>
                ✓ Зберегти
              </button>
              <button
                type='button'
                className='btn-secondary'
                onClick={() => setShowForm(false)}
              >
                ✕ Скасувати
              </button>
            </div>
          </form>
        ) : selectedEquipment ? (
          <div className='property-card'>
            <div
              className='card-header'
              style={{
                background: 'linear-gradient(135deg, #30b0c0 0%, #43e97b 100%)',
              }}
            >
              <h2>🔍 {selectedEquipment.name}</h2>
              <div className='card-actions'>
                <button
                  className='btn-icon edit'
                  onClick={() => setShowForm(true)}
                  title='Редагувати'
                >
                  ✏️
                </button>
                <button
                  className='btn-icon delete'
                  onClick={() => handleDeleteEquipment(selectedEquipment.id)}
                  title='Видалити'
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className='card-sections'>
              <section className='card-section'>
                <h3>📋 Інформація</h3>
                <div className='info-grid'>
                  <div className='info-row'>
                    <span className='label'>Тип:</span>
                    <span className='value'>{selectedEquipment.type}</span>
                  </div>
                  <div className='info-row'>
                    <span className='label'>Місцеположення:</span>
                    <span className='value'>{selectedEquipment.location}</span>
                  </div>
                  {selectedEquipment.calibrationDate && (
                    <div className='info-row'>
                      <span className='label'>Дата калібрування:</span>
                      <span className='value'>
                        {new Date(
                          selectedEquipment.calibrationDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </section>
              {selectedEquipment.notes && (
                <section className='card-section'>
                  <h3>📝 Примітки</h3>
                  <p className='notes'>{selectedEquipment.notes}</p>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className='empty-state'>
            <p>Виберіть обладнання зі списку або додайте нове</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default SearchControlEquipmentTab;
