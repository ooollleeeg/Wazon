import React, { useState } from 'react';

interface FireEquipmentFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const FireEquipmentForm: React.FC<FireEquipmentFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData 
}) => {
  const [formData, setFormData] = useState(initialData || {
    location: '',
    type: '',
    serialNumber: '',
    manufacturer: '',
    installationDate: '',
    lastInspectionDate: '',
    nextInspectionDate: '',
    inspectionCertificate: '',
    status: 'в експлуатації',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="property-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h2>🚒 Інформація про обладнання</h2>
        
        <div className="form-group">
          <label>Місцеположення *</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Місцеположення обладнання"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Тип обладнання *</label>
            <select name="type" value={formData.type} onChange={handleChange} required>
              <option value="">Виберіть тип</option>
              <option value="вогнегасник">Вогнегасник</option>
              <option value="гідрант">Гідрант</option>
              <option value="сигналізація">Сигналізація</option>
              <option value="система оповіщення">Система оповіщення</option>
              <option value="евакуаційне освітлення">Евакуаційне освітлення</option>
            </select>
          </div>

          <div className="form-group">
            <label>Статус</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="в експлуатації">В експлуатації</option>
              <option value="закрито">Закрито</option>
              <option value="на обслуговуванні">На обслуговуванні</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Серійний номер</label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              placeholder="SN-1234567"
            />
          </div>

          <div className="form-group">
            <label>Виробник</label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              placeholder="Назва виробника"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2>📅 Дати обслуговування</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label>Дата встановлення</label>
            <input
              type="date"
              name="installationDate"
              value={formData.installationDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Остання перевірка</label>
            <input
              type="date"
              name="lastInspectionDate"
              value={formData.lastInspectionDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Наступна перевірка</label>
            <input
              type="date"
              name="nextInspectionDate"
              value={formData.nextInspectionDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Сертифікат перевірки</label>
          <input
            type="text"
            name="inspectionCertificate"
            value={formData.inspectionCertificate}
            onChange={handleChange}
            placeholder="Номер/ідентифікатор сертифіката"
          />
        </div>
      </div>

      <div className="form-section">
        <h2>📝 Примітки</h2>
        <div className="form-group">
          <label>Додаткова інформація</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Спеціальні замітки про обладнання..."
            rows={4}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">✓ Зберегти</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>✕ Скасувати</button>
      </div>
    </form>
  );
};

export default FireEquipmentForm;