import React, { useState } from 'react';
import './GenericForm.css';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'email' | 'tel' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  options?: { value: string; label: string }[]; // For select fields
  fullWidth?: boolean;
}

export interface FormSection {
  title: string;
  icon?: string;
  fields: FormField[];
}

export interface NestedFieldConfig {
  name: string; // 'education', 'documents'
  title: string; // 'Освіта'
  icon?: string; // '📚'
  defaultItem: Record<string, any>;
  fields: FormField[];
}

export interface FormConfig {
  title: string;
  sections: FormSection[];
  nestedFields?: NestedFieldConfig[];
  submitLabel?: string; // 'Зберегти' (default)
}

interface GenericFormProps {
  config: FormConfig;
  onSubmit: (data: any) => void;
  initialData?: any;
  isLoading?: boolean;
  onClose?: () => void;
}

export default function GenericForm({
  config,
  onSubmit,
  initialData,
  isLoading,
  onClose,
}: GenericFormProps) {
  // Инициализируем данные формы
  const [formData, setFormData] = useState<any>(() => {
    console.log('Initializing form with:', initialData);

    if (initialData) {
      return initialData;
    }

    // Создаем пустую форму
    const emptyForm: any = {};

    // Добавляем основные поля
    config.sections.forEach((section) => {
      section.fields.forEach((field) => {
        emptyForm[field.name] = '';
      });
    });

    // Добавляем вложенные поля (пустые массивы)
    config.nestedFields?.forEach((nested) => {
      emptyForm[nested.name] = [];
    });

    return emptyForm;
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      const updated = { ...prev, [name]: value };
      console.log('Input changed:', name, '=', value);
      return updated;
    });
  };

  // ===== ВЛОЖЁННЫЕ ПОЛЯ =====
  const addNestedItem = (nestedName: string, config: NestedFieldConfig) => {
    console.log(`Adding ${nestedName}`);
    setFormData((prev: { [x: string]: any }) => ({
      ...prev,
      [nestedName]: [...prev[nestedName], { ...config.defaultItem }],
    }));
  };

  const updateNestedItem = (
    nestedName: string,
    index: number,
    field: string,
    value: any,
  ) => {
    console.log(`Updating ${nestedName}[${index}].${field} = ${value}`);
    setFormData((prev: { [x: string]: any }) => {
      const newItems = [...prev[nestedName]];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, [nestedName]: newItems };
    });
  };

  const removeNestedItem = (nestedName: string, index: number) => {
    console.log(`Removing ${nestedName}[${index}]`);
    setFormData((prev: { [x: string]: any[] }) => ({
      ...prev,
      [nestedName]: prev[nestedName].filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitting with data:', formData);
    onSubmit(formData);
  };

  const renderField = (field: FormField, value: any) => {
    const fieldClass = field.fullWidth ? 'full-width' : '';

    if (field.type === 'select') {
      return (
        <div key={field.name} className={`form-group ${fieldClass}`}>
          <label>
            {field.label}
            {field.required && ' *'}
          </label>
          <select
            name={field.name}
            value={value || ''}
            onChange={handleInputChange}
            required={field.required}
          >
            <option value=''>Виберіть опцію</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={field.name} className={`form-group ${fieldClass}`}>
        <label>
          {field.label}
          {field.required && ' *'}
        </label>
        <input
          type={field.type}
          name={field.name}
          value={value || ''}
          onChange={handleInputChange}
          required={field.required}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
        />
      </div>
    );
  };

  // ✅ ОКРЕМИЙ РЕНДЕРЕР ДЛЯ ВЛОЖЕНИХ ПОЛІВ
  const renderNestedField = (
    field: FormField,
    value: any,
    nestedName: string,
    itemIndex: number,
  ) => {
    const fieldClass = field.fullWidth ? 'full-width' : '';

    if (field.type === 'select') {
      return (
        <div key={field.name} className={`form-group ${fieldClass}`}>
          <label>
            {field.label}
            {field.required && ' *'}
          </label>
          <select
            value={value || ''}
            onChange={(e) =>
              updateNestedItem(
                nestedName,
                itemIndex,
                field.name,
                e.target.value,
              )
            }
            required={field.required}
          >
            <option value=''>Виберіть опцію</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={field.name} className={`form-group ${fieldClass}`}>
        <label>
          {field.label}
          {field.required && ' *'}
        </label>
        <input
          type={field.type}
          value={value || ''}
          onChange={(e) =>
            updateNestedItem(nestedName, itemIndex, field.name, e.target.value)
          }
          required={field.required}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
        />
      </div>
    );
  };

  return (
    <form className='generic-form' onSubmit={handleSubmit}>
      {/* FORM HEADER */}
      <div className='form-header'>
        <h2 className='form-title'>
          {initialData ? '✎ Редагування' : '+'} {config.title}
        </h2>
        <button
          type='button'
          className='form-close-btn'
          onClick={onClose}
          title='Закрити форму'
          aria-label='Закрити'
        >
          ✕
        </button>
      </div>

      {/* ОСНОВНІ СЕКЦІЇ */}
      {config.sections.map((section, sectionIdx) => (
        <section key={sectionIdx} className='form-section'>
          <h3>{section.title}</h3>
          <div className='form-grid'>
            {section.fields.map((field) =>
              renderField(field, formData[field.name]),
            )}
          </div>
        </section>
      ))}

      {/* ВЛОЖЁННЫЕ ПОЛЯ */}
      {config.nestedFields?.map((nestedConfig, idx) => (
        <section key={idx} className='form-section nested-section'>
          <div className='section-header'>
            <h3>
              {nestedConfig.icon} {nestedConfig.title}
            </h3>
            <button
              type='button'
              className='btn-add'
              onClick={() => addNestedItem(nestedConfig.name, nestedConfig)}
            >
              + Додати
            </button>
          </div>

          <div className='nested-items'>
            {formData[nestedConfig.name]?.map((item: any, itemIdx: number) => (
              <div key={itemIdx} className='nested-item'>
                <div className='nested-header'>
                  <span className='item-number'>
                    {nestedConfig.title} {itemIdx + 1}
                  </span>
                  <button
                    type='button'
                    className='btn-remove'
                    onClick={() => removeNestedItem(nestedConfig.name, itemIdx)}
                    title='Видалити'
                  >
                    ✕
                  </button>
                </div>

                <div className='form-grid'>
                  {nestedConfig.fields.map((field) =>
                    // ✅ ВИКОРИСТОВУЄМО renderNestedField ЗІ ЗВИЧАЙНОЇ ФУНКЦІЇ
                    renderNestedField(
                      field,
                      item[field.name],
                      nestedConfig.name,
                      itemIdx,
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* КНОПКИ */}
      <div className='form-actions'>
        <button type='submit' className='btn-submit' disabled={isLoading}>
          {isLoading ? 'Збереження...' : config.submitLabel || 'Зберегти'}
        </button>
      </div>
    </form>
  );
}
