import React, { useState } from 'react';
import '../styles/PropertyForm.css';

interface PropertyFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData 
}) => {
  const [formData, setFormData] = useState(initialData || {
    address: '',
    officeNumber: '',
    inspectionActNumbers: '',
    categorizationActNumber: '',
    area: '',
    buildingType: '',
    yearBuilt: '',
    ownerName: '',
    contactPhone: '',
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
        <h2>📍 Основная информация</h2>
        
        <div className="form-group">
          <label>Физический адрес *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="ул. Примера, дом 1, квартира 1"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Номер кабинета/помещения</label>
            <input
              type="text"
              name="officeNumber"
              value={formData.officeNumber}
              onChange={handleChange}
              placeholder="Кабинет 101"
            />
          </div>

          <div className="form-group">
            <label>Тип здания</label>
            <select name="buildingType" value={formData.buildingType} onChange={handleChange}>
              <option value="">Выберите тип</option>
              <option value="жилое">Жилое</option>
              <option value="нежилое">Нежилое</option>
              <option value="смешанное">Смешанное</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Площадь (м²)</label>
            <input
              type="number"
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder="150"
            />
          </div>

          <div className="form-group">
            <label>Год постройки</label>
            <input
              type="number"
              name="yearBuilt"
              value={formData.yearBuilt}
              onChange={handleChange}
              placeholder="2020"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2>📄 Документация</h2>
        
        <div className="form-group">
          <label>Номера актов обследования</label>
          <input
            type="text"
            name="inspectionActNumbers"
            value={formData.inspectionActNumbers}
            onChange={handleChange}
            placeholder="АКТ-2024-001, АКТ-2024-002"
          />
          <small>Через запятую</small>
        </div>

        <div className="form-group">
          <label>Номер акта категорирования *</label>
          <input
            type="text"
            name="categorizationActNumber"
            value={formData.categorizationActNumber}
            onChange={handleChange}
            placeholder="КАТ-2024-001"
            required
          />
        </div>
      </div>

      <div className="form-section">
        <h2>👤 Контактная информация</h2>
        
        <div className="form-group">
          <label>Фамилия И.О. владельца</label>
          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            placeholder="Иванов И.И."
          />
        </div>

        <div className="form-group">
          <label>Контактный телефон</label>
          <input
            type="tel"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            placeholder="+7 (999) 999-99-99"
          />
        </div>
      </div>

      <div className="form-section">
        <h2>📝 Примечания</h2>
        <div className="form-group">
          <label>Дополнительная информация</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Особенности объекта, ограничения, требования..."
            rows={4}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">✓ Сохранить</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>✕ Отменить</button>
      </div>
    </form>
  );
};

export default PropertyForm;