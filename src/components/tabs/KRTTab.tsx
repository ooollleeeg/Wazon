import React, { useState, useEffect } from 'react';
import '../../styles/TabContent.css';

function KRTTab() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/krt');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  const handleAddItem = async (data) => {
    try {
      const response = await fetch('/api/krt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newItem = await response.json();
      setItems([...items, newItem]);
      setShowForm(false);
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  };

  const handleUpdateItem = async (id, data) => {
    try {
      const response = await fetch(`/api/krt/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await response.json();
      setItems(items.map((i) => (i.id === id ? updated : i)));
      setSelectedItem(null);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Видалити КРТ?')) {
      try {
        await fetch(`/api/krt/${id}`, { method: 'DELETE' });
        setItems(items.filter((i) => i.id !== id));
        setSelectedItem(null);
      } catch (error) {
        console.error('Ошибка удаления:', error);
      }
    }
  };

  return (
    <div className='tab-layout'>
      <aside className='tab-sidebar'>
        <button className='btn-add' onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Отменить' : '+ Додати КРТ'}
        </button>
        <div className='property-list'>
          <div className='search-box'>
            <input type='text' placeholder='🔍 Пошук...' />
          </div>
          <div className='property-items'>
            {items.length === 0 ? (
              <p className='empty'>КРТ не знайдено</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`property-item ${selectedItem?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className='item-address'>📞 {item.name}</div>
                  <div className='item-meta'>
                    <span className='badge'>{item.model}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className='list-footer'>
            <small>Всього: {items.length}</small>
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
              handleAddItem({
                name: formData.get('name'),
                model: formData.get('model'),
                serialNumber: formData.get('serialNumber'),
                notes: formData.get('notes'),
              });
            }}
          >
            <div className='form-section'>
              <h2>📞 Комутаційно-розподільна техніка</h2>
              <div className='form-group'>
                <label>Назва *</label>
                <input
                  type='text'
                  name='name'
                  placeholder='Назва КРТ'
                  required
                />
              </div>
              <div className='form-row'>
                <div className='form-group'>
                  <label>Модель</label>
                  <input type='text' name='model' placeholder='Модель' />
                </div>
                <div className='form-group'>
                  <label>Серійний номер</label>
                  <input
                    type='text'
                    name='serialNumber'
                    placeholder='SN-12345'
                  />
                </div>
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
        ) : selectedItem ? (
          <div className='property-card'>
            <div
              className='card-header'
              style={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              }}
            >
              <h2>📞 {selectedItem.name}</h2>
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
                  onClick={() => handleDeleteItem(selectedItem.id)}
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
                    <span className='label'>Модель:</span>
                    <span className='value'>{selectedItem.model}</span>
                  </div>
                  <div className='info-row'>
                    <span className='label'>Серійний номер:</span>
                    <span className='value'>{selectedItem.serialNumber}</span>
                  </div>
                </div>
              </section>
              {selectedItem.notes && (
                <section className='card-section'>
                  <h3>📝 Примітки</h3>
                  <p className='notes'>{selectedItem.notes}</p>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className='empty-state'>
            <p>Виберіть КРТ зі списку або додайте нове</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default KRTTab;
