import React, { useState, useEffect } from 'react';
import '../../styles/TabContent.css';

function TZICheckTab() {
  const [checks, setChecks] = useState([]);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchChecks();
  }, []);

  const fetchChecks = async () => {
    try {
      const response = await fetch('/api/tzi-check');
      const data = await response.json();
      setChecks(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  const handleAddCheck = async (data) => {
    try {
      const response = await fetch('/api/tzi-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newCheck = await response.json();
      setChecks([...checks, newCheck]);
      setShowForm(false);
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  };

  const handleUpdateCheck = async (id, data) => {
    try {
      const response = await fetch(`/api/tzi-check/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await response.json();
      setChecks(checks.map((c) => (c.id === id ? updated : c)));
      setSelectedCheck(null);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  const handleDeleteCheck = async (id) => {
    if (window.confirm('Видалити перевірку?')) {
      try {
        await fetch(`/api/tzi-check/${id}`, { method: 'DELETE' });
        setChecks(checks.filter((c) => c.id !== id));
        setSelectedCheck(null);
      } catch (error) {
        console.error('Ошибка удаления:', error);
      }
    }
  };

  return (
    <div className='tab-layout'>
      <aside className='tab-sidebar'>
        <button className='btn-add' onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Отменить' : '+ Додати перевірку'}
        </button>
        <div className='property-list'>
          <div className='search-box'>
            <input type='text' placeholder='🔍 Пошук...' />
          </div>
          <div className='property-items'>
            {checks.length === 0 ? (
              <p className='empty'>Перевірок не знайдено</p>
            ) : (
              checks.map((check) => (
                <div
                  key={check.id}
                  className={`property-item ${selectedCheck?.id === check.id ? 'active' : ''}`}
                  onClick={() => setSelectedCheck(check)}
                >
                  <div className='item-address'>✓ {check.name}</div>
                  <div className='item-meta'>
                    <span className='badge'>{check.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className='list-footer'>
            <small>Всього: {checks.length}</small>
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
              handleAddCheck({
                name: formData.get('name'),
                date: formData.get('date'),
                status: formData.get('status'),
                result: formData.get('result'),
                notes: formData.get('notes'),
              });
            }}
          >
            <div className='form-section'>
              <h2>✓ Перевірки стану ТЗІ</h2>
              <div className='form-group'>
                <label>Назва перевірки *</label>
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
                <label>Результат</label>
                <textarea
                  name='result'
                  placeholder='Результати перевірки...'
                  rows={3}
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
        ) : selectedCheck ? (
          <div className='property-card'>
            <div
              className='card-header'
              style={{
                background: 'linear-gradient(135deg, #fed6e3 0%, #ff7675 100%)',
              }}
            >
              <h2>✓ {selectedCheck.name}</h2>
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
                  onClick={() => handleDeleteCheck(selectedCheck.id)}
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
                      {selectedCheck.status}
                    </span>
                  </div>
                  {selectedCheck.date && (
                    <div className='info-row'>
                      <span className='label'>Дата:</span>
                      <span className='value'>
                        {new Date(selectedCheck.date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </section>
              {selectedCheck.result && (
                <section className='card-section'>
                  <h3>📊 Результати</h3>
                  <p className='notes'>{selectedCheck.result}</p>
                </section>
              )}
              {selectedCheck.notes && (
                <section className='card-section'>
                  <h3>📝 Примітки</h3>
                  <p className='notes'>{selectedCheck.notes}</p>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className='empty-state'>
            <p>Виберіть перевірку зі списку або додайте нову</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default TZICheckTab;
