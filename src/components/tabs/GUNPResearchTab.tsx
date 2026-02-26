import React, { useState, useEffect } from 'react';
import '../../styles/TabContent.css';

function GUNPResearchTab() {
  const [research, setResearch] = useState([]);
  const [selectedResearch, setSelectedResearch] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchResearch();
  }, []);

  const fetchResearch = async () => {
    try {
      const response = await fetch('/api/gunp-research');
      const data = await response.json();
      setResearch(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  const handleAddResearch = async (data) => {
    try {
      const response = await fetch('/api/gunp-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newResearch = await response.json();
      setResearch([...research, newResearch]);
      setShowForm(false);
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  };

  const handleUpdateResearch = async (id, data) => {
    try {
      const response = await fetch(`/api/gunp-research/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await response.json();
      setResearch(research.map((r) => (r.id === id ? updated : r)));
      setSelectedResearch(null);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  const handleDeleteResearch = async (id) => {
    if (window.confirm('Видалити дослідження?')) {
      try {
        await fetch(`/api/gunp-research/${id}`, { method: 'DELETE' });
        setResearch(research.filter((r) => r.id !== id));
        setSelectedResearch(null);
      } catch (error) {
        console.error('Ошибка удаления:', error);
      }
    }
  };

  return (
    <div className='tab-layout'>
      <aside className='tab-sidebar'>
        <button className='btn-add' onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Отменить' : '+ Додати дослідження'}
        </button>
        <div className='property-list'>
          <div className='search-box'>
            <input type='text' placeholder='🔍 Пошук...' />
          </div>
          <div className='property-items'>
            {research.length === 0 ? (
              <p className='empty'>Дослідження не знайдено</p>
            ) : (
              research.map((item) => (
                <div
                  key={item.id}
                  className={`property-item ${selectedResearch?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedResearch(item)}
                >
                  <div className='item-address'>🔬 {item.name}</div>
                  <div className='item-meta'>
                    <span className='badge'>{item.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className='list-footer'>
            <small>Всього: {research.length}</small>
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
              handleAddResearch({
                name: formData.get('name'),
                date: formData.get('date'),
                status: formData.get('status'),
                findings: formData.get('findings'),
                notes: formData.get('notes'),
              });
            }}
          >
            <div className='form-section'>
              <h2>🔬 Інструментальні дослідження ГУНП</h2>
              <div className='form-group'>
                <label>Назва дослідження *</label>
                <input type='text' name='name' placeholder='Назва' required />
              </div>
              <div className='form-row'>
                <div className='form-group'>
                  <label>Дата проведення</label>
                  <input type='date' name='date' />
                </div>
                <div className='form-group'>
                  <label>Статус</label>
                  <select name='status'>
                    <option value='активна'>Активна</option>
                    <option value='завершена'>Завершена</option>
                    <option value='очікує'>Очікує</option>
                  </select>
                </div>
              </div>
              <div className='form-group'>
                <label>Знахідки</label>
                <textarea
                  name='findings'
                  placeholder='Результати та знахідки...'
                  rows={4}
                ></textarea>
              </div>
              <div className='form-group'>
                <label>Примітки</label>
                <textarea
                  name='notes'
                  placeholder='Додаткова інформація...'
                  rows={3}
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
        ) : selectedResearch ? (
          <div className='property-card'>
            <div
              className='card-header'
              style={{
                background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
              }}
            >
              <h2>🔬 {selectedResearch.name}</h2>
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
                  onClick={() => handleDeleteResearch(selectedResearch.id)}
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
                    <span className='label'>Статус:</span>
                    <span className='value act-badge'>
                      {selectedResearch.status}
                    </span>
                  </div>
                  {selectedResearch.date && (
                    <div className='info-row'>
                      <span className='label'>Дата:</span>
                      <span className='value'>
                        {new Date(selectedResearch.date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </section>
              {selectedResearch.findings && (
                <section className='card-section'>
                  <h3>📊 Знахідки</h3>
                  <p className='notes'>{selectedResearch.findings}</p>
                </section>
              )}
              {selectedResearch.notes && (
                <section className='card-section'>
                  <h3>📝 Примітки</h3>
                  <p className='notes'>{selectedResearch.notes}</p>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className='empty-state'>
            <p>Виберіть дослідження зі списку або додайте нове</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default GUNPResearchTab;
