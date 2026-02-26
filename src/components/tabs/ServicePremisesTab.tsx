import React, { useState, useEffect } from 'react';
import '../../styles/TabContent.css';

function ServicePremisesTab() {
  const [premises, setPremises] = useState([]);
  const [selectedPremise, setSelectedPremise] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPremises();
  }, []);

  const fetchPremises = async () => {
    try {
      const response = await fetch('/api/service-premises');
      const data = await response.json();
      setPremises(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  const handleAddPremise = async (data) => {
    try {
      const response = await fetch('/api/service-premises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newPremise = await response.json();
      setPremises([...premises, newPremise]);
      setShowForm(false);
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  };

  const handleUpdatePremise = async (id, data) => {
    try {
      const response = await fetch(`/api/service-premises/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await response.json();
      setPremises(premises.map((p) => (p.id === id ? updated : p)));
      setSelectedPremise(null);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  const handleDeletePremise = async (id) => {
    if (window.confirm('Видалити приміщення?')) {
      try {
        await fetch(`/api/service-premises/${id}`, { method: 'DELETE' });
        setPremises(premises.filter((p) => p.id !== id));
        setSelectedPremise(null);
      } catch (error) {
        console.error('Ошибка удаления:', error);
      }
    }
  };

  return (
    <div className='tab-layout'>
      <aside className='tab-sidebar'>
        <button className='btn-add' onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Отменить' : '+ Додати приміщення'}
        </button>
        <div className='property-list'>
          <div className='search-box'>
            <input type='text' placeholder='🔍 Пошук...' />
          </div>
          <div className='property-items'>
            {premises.length === 0 ? (
              <p className='empty'>Приміщення не знайдено</p>
            ) : (
              premises.map((premise) => (
                <div
                  key={premise.id}
                  className={`property-item ${selectedPremise?.id === premise.id ? 'active' : ''}`}
                  onClick={() => setSelectedPremise(premise)}
                >
                  <div className='item-address'>🏠 {premise.name}</div>
                  <div className='item-meta'>
                    <span className='badge'>{premise.address}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className='list-footer'>
            <small>Всього: {premises.length}</small>
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
              handleAddPremise({
                name: formData.get('name'),
                address: formData.get('address'),
                area: formData.get('area'),
                notes: formData.get('notes'),
              });
            }}
          >
            <div className='form-section'>
              <h2>🏠 Інформація про приміщення</h2>
              <div className='form-group'>
                <label>Назва *</label>
                <input
                  type='text'
                  name='name'
                  placeholder='Назва приміщення'
                  required
                />
              </div>
              <div className='form-group'>
                <label>Адреса</label>
                <input type='text' name='address' placeholder='Адреса' />
              </div>
              <div className='form-group'>
                <label>Площа (м²)</label>
                <input type='number' name='area' placeholder='100' />
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
        ) : selectedPremise ? (
          <div className='property-card'>
            <div
              className='card-header'
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              }}
            >
              <h2>🏠 {selectedPremise.name}</h2>
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
                  onClick={() => handleDeletePremise(selectedPremise.id)}
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
                    <span className='label'>Адреса:</span>
                    <span className='value'>{selectedPremise.address}</span>
                  </div>
                  <div className='info-row'>
                    <span className='label'>Площа:</span>
                    <span className='value'>{selectedPremise.area} м²</span>
                  </div>
                </div>
              </section>
              {selectedPremise.notes && (
                <section className='card-section'>
                  <h3>📝 Примітки</h3>
                  <p className='notes'>{selectedPremise.notes}</p>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className='empty-state'>
            <p>Виберіть приміщення зі списку або додайте нове</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default ServicePremisesTab;
