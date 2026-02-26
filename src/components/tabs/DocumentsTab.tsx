import React, { useState, useEffect } from 'react';
import '../../styles/TabContent.css';

function DocumentsTab() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  const handleAddDocument = async (data) => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newDocument = await response.json();
      setDocuments([...documents, newDocument]);
      setShowForm(false);
    } catch (error) {
      console.error('Ошибка добавления:', error);
    }
  };

  const handleUpdateDocument = async (id, data) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await response.json();
      setDocuments(documents.map((d) => (d.id === id ? updated : d)));
      setSelectedDocument(null);
    } catch (error) {
      console.error('Ошибка обновления:', error);
    }
  };

  const handleDeleteDocument = async (id) => {
    if (window.confirm('Видалити документ?')) {
      try {
        await fetch(`/api/documents/${id}`, { method: 'DELETE' });
        setDocuments(documents.filter((d) => d.id !== id));
        setSelectedDocument(null);
      } catch (error) {
        console.error('Ошибка удаления:', error);
      }
    }
  };

  return (
    <div className='tab-layout'>
      <aside className='tab-sidebar'>
        <button className='btn-add' onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Отменить' : '+ Додати документ'}
        </button>
        <div className='property-list'>
          <div className='search-box'>
            <input type='text' placeholder='🔍 Пошук...' />
          </div>
          <div className='property-items'>
            {documents.length === 0 ? (
              <p className='empty'>Документів не знайдено</p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`property-item ${selectedDocument?.id === doc.id ? 'active' : ''}`}
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className='item-address'>📄 {doc.name}</div>
                  <div className='item-meta'>
                    <span className='badge'>{doc.type}</span>
                    <span className='badge status'>{doc.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className='list-footer'>
            <small>Всього: {documents.length}</small>
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
              handleAddDocument({
                name: formData.get('name'),
                type: formData.get('type'),
                number: formData.get('number'),
                date: formData.get('date'),
                expirationDate: formData.get('expirationDate'),
                status: formData.get('status'),
                notes: formData.get('notes'),
              });
            }}
          >
            <div className='form-section'>
              <h2>📄 Документи за терміном</h2>
              <div className='form-group'>
                <label>Назва документа *</label>
                <input type='text' name='name' placeholder='Назва' required />
              </div>
              <div className='form-row'>
                <div className='form-group'>
                  <label>Тип документа</label>
                  <input type='text' name='type' placeholder='Тип' />
                </div>
                <div className='form-group'>
                  <label>Номер документа</label>
                  <input type='text' name='number' placeholder='№' />
                </div>
              </div>
              <div className='form-row'>
                <div className='form-group'>
                  <label>Дата видачі</label>
                  <input type='date' name='date' />
                </div>
                <div className='form-group'>
                  <label>Дата закінчення</label>
                  <input type='date' name='expirationDate' />
                </div>
              </div>
              <div className='form-group'>
                <label>Статус</label>
                <select name='status'>
                  <option value='активна'>Активна</option>
                  <option value='закінчується'>Закінчується</option>
                  <option value='закінчена'>Закінчена</option>
                  <option value='продовжена'>Продовжена</option>
                </select>
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
        ) : selectedDocument ? (
          <div className='property-card'>
            <div
              className='card-header'
              style={{
                background: 'linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%)',
              }}
            >
              <h2>📄 {selectedDocument.name}</h2>
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
                  onClick={() => handleDeleteDocument(selectedDocument.id)}
                  title='Видалити'
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className='card-sections'>
              <section className='card-section'>
                <h3>📋 Інформація про документ</h3>
                <div className='info-grid'>
                  {selectedDocument.type && (
                    <div className='info-row'>
                      <span className='label'>Тип:</span>
                      <span className='value'>{selectedDocument.type}</span>
                    </div>
                  )}
                  {selectedDocument.number && (
                    <div className='info-row'>
                      <span className='label'>Номер:</span>
                      <span className='value'>{selectedDocument.number}</span>
                    </div>
                  )}
                  <div className='info-row'>
                    <span className='label'>Статус:</span>
                    <span className='value act-badge'>
                      {selectedDocument.status}
                    </span>
                  </div>
                </div>
              </section>
              <section className='card-section'>
                <h3>📅 Дати</h3>
                <div className='info-grid'>
                  {selectedDocument.date && (
                    <div className='info-row'>
                      <span className='label'>Дата видачі:</span>
                      <span className='value'>
                        {new Date(selectedDocument.date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {selectedDocument.expirationDate && (
                    <div className='info-row'>
                      <span className='label'>Дата закінчення:</span>
                      <span className='value'>
                        {new Date(
                          selectedDocument.expirationDate,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </section>
              {selectedDocument.notes && (
                <section className='card-section'>
                  <h3>📝 Примітки</h3>
                  <p className='notes'>{selectedDocument.notes}</p>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className='empty-state'>
            <p>Виберіть документ зі списку або додайте новий</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default DocumentsTab;
