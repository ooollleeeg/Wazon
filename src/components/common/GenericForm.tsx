import React, { useState, useRef, useEffect } from 'react';
import './GenericForm.css';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import LoadingSpinner from './LoadingSpinner';

export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'date'
    | 'number'
    | 'email'
    | 'tel'
    | 'textarea'
    | 'select'
    | 'checkbox';
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  options?: { value: string; label: string }[]; // For select fields
  fullWidth?: boolean;
  visibleWhen?: {
    field: string;
    values: string[];
  };
  hiddenWhen?: {
    field: string;
    values: string[];
  };
  helperText?: string; // Допоміжний текст під полем
  calculateFrom?: {
    field: string;
    years?: number;
    months?: number;
    days?: number;
  }; // Для автоматичного розрахунку строку від іншої дати
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
  dateField?: string; // Field for sorting (newer first)
  hideAllByDefault?: boolean; // Hide all records by default in form view
  hiddenWhen?: {
    field: string;
    values: string[];
  };
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

const addCalendarOffset = (
  value: string,
  offset: { years?: number; months?: number; days?: number },
) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const sourceDate = new Date(Date.UTC(year, month - 1, day));
  if (
    sourceDate.getUTCFullYear() !== year ||
    sourceDate.getUTCMonth() !== month - 1 ||
    sourceDate.getUTCDate() !== day
  ) {
    return null;
  }

  const targetMonthIndex =
    year * 12 + month - 1 + (offset.years || 0) * 12 + (offset.months || 0);
  const targetYear = Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const targetDay = Math.min(
    day,
    new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate(),
  );
  const resultDate = new Date(Date.UTC(targetYear, targetMonth, targetDay));
  resultDate.setUTCDate(resultDate.getUTCDate() + (offset.days || 0));

  return [
    String(resultDate.getUTCFullYear()).padStart(4, '0'),
    String(resultDate.getUTCMonth() + 1).padStart(2, '0'),
    String(resultDate.getUTCDate()).padStart(2, '0'),
  ].join('-');
};

export default function GenericForm({
  config,
  onSubmit,
  initialData,
  isLoading,
  onClose,
}: GenericFormProps) {
  // State для отслеживания удаляемого элемента
  const [deletingItem, setDeletingItem] = useState<{
    nested: string;
    index: number;
    itemTitle: string;
  } | null>(null);

  // State для отслеживания недавно добавленного элемента
  const [newlyAddedItem, setNewlyAddedItem] = useState<{
    nested: string;
    index: number;
  } | null>(null);

  // State для отслеживания развернутых nested sections с hideAllByDefault
  const [expandedNestedSections, setExpandedNestedSections] = useState<{
    [key: string]: boolean;
  }>({});

  // Refs для прокрутки к новому элементу
  const nestedItemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Инициализируем данные формы
  const [formData, setFormData] = useState<any>(() => {
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

  // Функція для сортування nested items за датою (новіші першими)
  const sortByDate = (items: any[], dateField?: string) => {
    if (!dateField) return items;

    // Розділяємо на items з датою і без
    const itemsWithDate = items.filter((item) => item[dateField]);
    const itemsWithoutDate = items.filter((item) => !item[dateField]);

    // Сортуємо за датою (новіші першими)
    itemsWithDate.sort((a, b) => {
      const dateA = new Date(a[dateField]).getTime();
      const dateB = new Date(b[dateField]).getTime();
      return dateB - dateA; // Спадаючий порядок
    });

    // Повертаємо: спочатку з датою (новіші), потім без дати
    return [...itemsWithDate, ...itemsWithoutDate];
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name } = e.target;

    // ✅ ДЛЯ CHECKBOX ВИКОРИСТОВУЄМО checked, А НЕ value
    let value: any;
    if ((e.target as HTMLInputElement).type === 'checkbox') {
      value = (e.target as HTMLInputElement).checked;
    } else {
      value = e.target.value;
    }

    setFormData((prev: any) => {
      const updated = { ...prev, [name]: value };

      // Знаходимо поле конфігурації для розрахунку (для вложених полів)
      const findFieldConfig = (fieldName: string) => {
        // Шукаємо в основних полях форми
        for (const section of config.sections) {
          const field = section.fields.find((f) => f.name === fieldName);
          if (field) return field;
        }

        // Шукаємо в вложених полях
        for (const nested of config.nestedFields || []) {
          const field = nested.fields.find((f) => f.name === fieldName);
          if (field) return field;
        }

        return null;
      };

      const targetFieldName = Object.keys(updated).find((key) => {
        const targetField = findFieldConfig(key);
        return targetField?.calculateFrom?.field === name;
      });
      const targetField = targetFieldName
        ? findFieldConfig(targetFieldName)
        : null;
      if (value && targetField?.calculateFrom && targetFieldName) {
        try {
          const calculatedDate = addCalendarOffset(
            value,
            targetField.calculateFrom,
          );
          if (calculatedDate) updated[targetFieldName] = calculatedDate;
        } catch (err) {
          console.error('Error calculating date:', err);
        }
      }

      return updated;
    });
  };

  // ✅ ПРОКРУТКА К НОВОМУ ELEMENT'У
  useEffect(() => {
    if (newlyAddedItem) {
      const refKey = `${newlyAddedItem.nested}-${newlyAddedItem.index}`;
      const element = nestedItemRefs.current[refKey];

      if (element) {
        // Плавна прокрутка к элем
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Видаляємо посилання на item після прокрутки
          setTimeout(() => setNewlyAddedItem(null), 1000);
        }, 100);
      }
    }
  }, [newlyAddedItem]);

  // ===== ВЛОЖЁННЫЕ ПОЛЯ =====
  const addNestedItem = (nestedName: string, config: NestedFieldConfig) => {
    setFormData((prev: { [x: string]: any }) => {
      const newItems = [
        ...prev[nestedName],
        { ...config.defaultItem, __isNew: true },
      ];
      // ✅ ВСТАНОВЛЮЄМО НОВИЙ ITEM ДЛЯ ПРОКРУТКИ
      setNewlyAddedItem({
        nested: nestedName,
        index: newItems.length - 1,
      });
      return {
        ...prev,
        [nestedName]: newItems,
      };
    });

    // ✅ РОЗГОРНУТИ СЕКЦІЮ ЯКЩО ВОНА МА hideAllByDefault
    if (config.hideAllByDefault) {
      setExpandedNestedSections((prev) => ({
        ...prev,
        [nestedName]: true,
      }));
    }
  };

  const toggleExpandNestedSection = (nestedName: string) => {
    setExpandedNestedSections((prev) => ({
      ...prev,
      [nestedName]: !prev[nestedName],
    }));
  };

  const updateNestedItem = (
    nestedName: string,
    index: number,
    field: string,
    value: any,
  ) => {
    setFormData((prev: { [x: string]: any }) => {
      const newItems = [...prev[nestedName]];
      newItems[index] = { ...newItems[index], [field]: value };

      // Перевіряємо чи потребується розрахунок для цього вложеного поля
      const nestedConfig = config.nestedFields?.find(
        (n) => n.name === nestedName,
      );
      if (nestedConfig) {
        const fieldConfig = nestedConfig.fields.find((f) => f.name === field);

        // Якщо змінюємо вихідне поле (наприклад, categorizationActDate)
        if (fieldConfig && value) {
          // Шукаємо поле з розрахунком
          const targetField = nestedConfig.fields.find((f) => {
            return (
              'calculateFrom' in f &&
              f.calculateFrom &&
              f.calculateFrom.field === field
            );
          });

          if (
            targetField &&
            'calculateFrom' in targetField &&
            targetField.calculateFrom
          ) {
            try {
              const calculatedDate = addCalendarOffset(
                value,
                targetField.calculateFrom,
              );
              if (calculatedDate) {
                newItems[index] = {
                  ...newItems[index],
                  [targetField.name]: calculatedDate,
                };
              }
            } catch (err) {
              console.error('Error calculating date:', err);
            }
          }
        }
      }

      return { ...prev, [nestedName]: newItems };
    });
  };

  const removeNestedItem = (nestedName: string, index: number) => {
    setFormData((prev: { [x: string]: any[] }) => ({
      ...prev,
      [nestedName]: prev[nestedName].filter((_: any, i: number) => i !== index),
    }));
    setDeletingItem(null);
  };

  const openDeleteConfirm = (
    nestedName: string,
    index: number,
    itemTitle: string,
  ) => {
    setDeletingItem({ nested: nestedName, index, itemTitle });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ ОЧИЩАЄМО ДАНІ ВІД ФЛАГА __isNew ПЕРЕД ВІДПРАВКОЮ
    const cleanedData = { ...formData };
    delete cleanedData.sharedProtectionMeans;

    // ✅ ПЕРЕТВОРЮЄМО BOOLEAN ЗНАЧЕННЯ ДЛЯ isProcessingSuspended
    if (cleanedData.isProcessingSuspended === true) {
      cleanedData.isProcessingSuspended = 1;
    } else if (cleanedData.isProcessingSuspended === false) {
      cleanedData.isProcessingSuspended = 0;
    }

    config.nestedFields?.forEach((nestedConfig) => {
      if (cleanedData[nestedConfig.name]) {
        // Очищуємо від __isNew
        let items = cleanedData[nestedConfig.name].map((item: any) => {
          const { __isNew, ...cleanItem } = item;
          return cleanItem;
        });

        // Сортуємо за датою (новіші першими) перед відправкою
        items = sortByDate(items, nestedConfig.dateField);

        cleanedData[nestedConfig.name] = items;
      }
    });

    onSubmit(cleanedData);
  };

  const renderField = (field: FormField, value: any) => {
    const fieldClass = field.fullWidth ? 'full-width' : '';

    if (field.type === 'checkbox') {
      // ✅ КНОПКА ДЛЯ ПАУЗИ ОБРОБКИ ЗАМІСТЬ ЧЕКБОКСА
      if (field.name === 'isProcessingSuspended') {
        const isSuspended = value ? true : false;
        const buttonLabel = isSuspended
          ? 'Відновити обробку ІзОД'
          : 'Призупинити обробку ІзОД';
        const buttonClass = isSuspended ? 'suspended' : 'active';

        const handlePauseToggle = () => {
          setFormData((prev: any) => ({
            ...prev,
            [field.name]: !isSuspended,
          }));
        };

        return (
          <div
            key={field.name}
            className={`form-group pause-button-group pause-button-small ${fieldClass}`}
          >
            <button
              type='button'
              className={`pause-button pause-button-${buttonClass}`}
              onClick={handlePauseToggle}
            >
              {buttonLabel}
            </button>
          </div>
        );
      }

      // ✅ ЗВИЧАЙНИЙ ЧЕКБОКС ДЛЯ ІНШИХ ПОЛІВ
      const isChecked = value ? true : false;
      const displayLabel = field.label;

      return (
        <div
          key={field.name}
          className={`form-group checkbox-group ${fieldClass}`}
        >
          <label className='checkbox-label'>
            <input
              type='checkbox'
              name={field.name}
              checked={isChecked}
              onChange={handleInputChange}
            />
            <span>{displayLabel}</span>
            {field.required && <span className='required-mark'> *</span>}
          </label>
          {field.helperText && (
            <small className='helper-text'>{field.helperText}</small>
          )}
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div
          key={field.name}
          className={`form-group ${fieldClass} ${
            field.readOnly ? 'form-group-read-only' : ''
          }`}
        >
          <label>
            {field.label}
            {field.required && <span className='required-mark'> *</span>}
          </label>
          <select
            name={field.name}
            value={value || ''}
            onChange={handleInputChange}
            required={field.required}
            disabled={field.readOnly}
          >
            <option value=''>Виберіть опцію</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {field.helperText && (
            <small className='helper-text'>{field.helperText}</small>
          )}
        </div>
      );
    }

    return (
      <div
        key={field.name}
        className={`form-group ${fieldClass} ${
          field.readOnly ? 'form-group-read-only' : ''
        }`}
      >
        <label>
          {field.label}
          {field.required && <span className='required-mark'> *</span>}
        </label>
        <input
          type={field.type}
          name={field.name}
          value={value || ''}
          onChange={handleInputChange}
          required={field.required}
          disabled={field.readOnly}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
        />
        {field.helperText && (
          <small className='helper-text'>{field.helperText}</small>
        )}
      </div>
    );
  };

  // ✅ ОКРЕМИЙ РЕНДЕРЕР ДЛЯ ВЛОЖЕНИХ ПОЛІВ
  const renderNestedField = (
    field: FormField,
    value: any,
    nestedName: string,
    itemIndex: number,
    item: any,
  ) => {
    // Перевіряємо умову видимості
    if (field.visibleWhen) {
      const { field: conditionField, values: conditionValues } =
        field.visibleWhen;
      const fieldValue = item[conditionField];
      if (!conditionValues.includes(fieldValue)) {
        return null; // Не показуємо поле
      }
    }

    const fieldClass = field.fullWidth ? 'full-width' : '';

    if (field.type === 'select') {
      return (
        <div key={field.name} className={`form-group ${fieldClass}`}>
          <label>
            {field.label}
            {field.required && <span className='required-mark'> *</span>}
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
          {field.required && <span className='required-mark'> *</span>}
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
          {initialData
            ? '✎ Редагування інформації про'
            : '+ Додавання інформації про'}{' '}
          {config.title}
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
              field.hiddenWhen?.values.includes(formData[field.hiddenWhen.field])
                ? null
                : renderField(field, formData[field.name]),
            )}
          </div>
        </section>
      ))}

      {/* ВЛОЖЁННЫЕ ПОЛЯ */}
      {config.nestedFields?.map((nestedConfig, idx) => {
        if (
          nestedConfig.hiddenWhen?.values.includes(
            formData[nestedConfig.hiddenWhen.field],
          )
        ) {
          return null;
        }
        const items = formData[nestedConfig.name] || [];
        const savedItems = items.filter((item: any) => !item.__isNew); // Лічимо тільки збережені
        const isExpanded = expandedNestedSections[nestedConfig.name];
        const shouldHideByDefault = nestedConfig.hideAllByDefault;
        const displayItems = shouldHideByDefault
          ? isExpanded
            ? items
            : []
          : items;
        const showToggleButton = shouldHideByDefault && items.length > 0;

        return (
          <section key={idx} className='form-section nested-section'>
            <div className='section-header'>
              <h3>
                {nestedConfig.icon} {nestedConfig.title}
                {savedItems.length > 0 && ` (${savedItems.length})`}
              </h3>
              <button
                type='button'
                className='btn-add'
                onClick={() => addNestedItem(nestedConfig.name, nestedConfig)}
              >
                + Додати
              </button>
            </div>

            {showToggleButton && (
              <button
                type='button'
                className='btn-toggle-nested-form'
                onClick={() => toggleExpandNestedSection(nestedConfig.name)}
              >
                {isExpanded
                  ? '← Приховати'
                  : `↓ Переглянути${savedItems.length > 0 ? ` (${savedItems.length})` : ''}`}
              </button>
            )}

            <div className='nested-items'>
              {displayItems?.map((item: any, itemIdx: number) => {
                const refKey = `${nestedConfig.name}-${itemIdx}`;
                const isNewlyAdded =
                  newlyAddedItem?.nested === nestedConfig.name &&
                  newlyAddedItem?.index === itemIdx;

                return (
                  <div
                    key={itemIdx}
                    ref={(el) => {
                      if (el) {
                        nestedItemRefs.current[refKey] = el;
                      }
                    }}
                    className={`nested-item ${isNewlyAdded ? 'newly-added' : ''}`}
                  >
                    <div className='nested-header'>
                      <span className='item-number'>
                        {nestedConfig.title} {itemIdx + 1}
                      </span>
                      {/* ✅ ХРЕСТИК ТІЛЬКИ ДЛЯ НОВИХ ЗАПИСІВ */}
                      {item.__isNew && (
                        <button
                          type='button'
                          className='btn-remove-new'
                          onClick={() =>
                            removeNestedItem(nestedConfig.name, itemIdx)
                          }
                          title='Видалити поле без збереження'
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className='form-grid'>
                      {nestedConfig.fields.map((field) =>
                        // ✅ ВИКОРИСТОВУЄМО renderNestedField ЗІ ЗВИЧАЙНОЇ ФУНКЦІЇ
                        renderNestedField(
                          field,
                          item[field.name],
                          nestedConfig.name,
                          itemIdx,
                          item,
                        ),
                      )}
                    </div>

                    {/* ✅ КНОПКА ВИДАЛЕННЯ ТІЛЬКИ ДЛЯ ІСНУЮЧИХ ЗАПИСІВ */}
                    {!item.__isNew && (
                      <div className='nested-footer'>
                        <button
                          type='button'
                          className='btn-delete-nested'
                          onClick={() =>
                            openDeleteConfirm(
                              nestedConfig.name,
                              itemIdx,
                              item[nestedConfig.fields[0].name] ||
                                `${nestedConfig.title} ${itemIdx + 1}`,
                            )
                          }
                          title='Видалити запис'
                        >
                          🗑️ Видалити запис
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* КНОПКИ */}
      {isLoading && (
        <LoadingSpinner
          fullScreen
          label={
            config.submitLabel ? `${config.submitLabel}...` : 'Збереження...'
          }
          size='small'
        />
      )}
      <div className='form-actions'>
        <button type='submit' className='btn-submit' disabled={isLoading}>
          {isLoading ? 'Обробляємо...' : config.submitLabel || 'Зберегти'}
        </button>
      </div>

      {/* MODAL - Видалення вложеного запису */}
      {deletingItem && (
        <DeleteConfirmModal
          fullName={deletingItem.itemTitle}
          onConfirm={() =>
            removeNestedItem(deletingItem.nested, deletingItem.index)
          }
          onCancel={() => setDeletingItem(null)}
          isLoading={false}
        />
      )}
    </form>
  );
}
