import { useState } from 'react';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import './GenericCard.css';

export interface CardSection {
  title: string;
  icon?: string;
  fields: {
    label: string;
    value: string; // Path to data (e.g., 'fullName', 'address')
    format?: 'date' | 'link' | 'badge' | 'text'; // How to display
  }[];
}

export interface NestedCardSection {
  name: string; // 'education', 'documents'
  title: string; // 'Освіта'
  icon?: string; // '📚'
  itemTitle: string; // Field to use as title (e.g., 'institution')
  fields: {
    label: string;
    value: string; // Field name in nested item
    format?: 'date' | 'text';
  }[];
}

export interface CardConfig {
  title: string; // Main title source field (e.g., 'fullName')
  subtitle?: string; // Secondary title source field
  sections: CardSection[];
  nestedSections?: NestedCardSection[];
  deleteLabel: string; // 'Видалити запис про...'
  deleteConfirmName: (data: any) => string; // Function to generate confirm text
}

interface GenericCardProps {
  config: CardConfig;
  data: any;
  onEdit: () => void;
  onDelete: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function GenericCard({
  config,
  data,
  onEdit,
  onDelete,
  onClose,
  showCloseButton = true,
}: GenericCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatValue = (value: any, format?: string) => {
    if (!value) return '-';

    switch (format) {
      case 'date':
        return new Date(value).toLocaleDateString('uk-UA');
      case 'link':
        if (value.includes('@')) {
          return (
            <a href={`mailto:${value}`} className='value link'>
              {value}
            </a>
          );
        }
        if (value.startsWith('+') || value.startsWith('0')) {
          return (
            <a href={`tel:${value}`} className='value link'>
              {value}
            </a>
          );
        }
        return value;
      case 'badge':
        return <span className='value badge'>{value}</span>;
      default:
        return value;
    }
  };

  const getFieldValue = (path: string) => {
    const keys = path.split('.');
    let value: any = data;
    for (const key of keys) {
      value = value?.[key];
    }
    return value;
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    onDelete();
  };

  const title = getFieldValue(config.title);
  const subtitle = config.subtitle ? getFieldValue(config.subtitle) : null;

  return (
    <>
      <div className='generic-card'>
        {/* HEADER */}
        <div className='card-header'>
          <div className='card-title'>
            <h3>{title}</h3>
            {subtitle && <p className='subtitle'>{subtitle}</p>}
          </div>
          <div className='card-actions'>
            <button
              className='btn-icon btn-edit'
              onClick={onEdit}
              title='Редагувати'
            >
              ✎
            </button>
            {showCloseButton && onClose && (
              <button
                className='btn-icon btn-close'
                onClick={onClose}
                title='Закрити картку'
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className='card-content'>
          {/* Основні секції */}
          {config.sections.map((section, idx) => (
            <section key={idx} className='card-section'>
              <h4 className='section-title'>
                {section.icon} {section.title}
              </h4>
              <div className='info-grid'>
                {section.fields.map((field, fieldIdx) => {
                  const value = getFieldValue(field.value);
                  if (!value) return null;

                  return (
                    <div
                      key={fieldIdx}
                      className={`info-item ${
                        field.format === 'badge' ? 'badge-item' : ''
                      }`}
                    >
                      <span className='label'>{field.label}:</span>
                      <span className='value'>
                        {formatValue(value, field.format)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Вложённые секции */}
          {config.nestedSections?.map((nested, idx) => {
            const items = data[nested.name];
            if (!items || items.length === 0) return null;

            return (
              <section key={idx} className='card-section nested-section'>
                <h4 className='section-title'>
                  {nested.icon} {nested.title} ({items.length})
                </h4>
                <div className='nested-list'>
                  {items.map((item: any, itemIdx: number) => (
                    <div key={itemIdx} className='nested-item'>
                      <div className='nested-item-header'>
                        <span className='item-number'>{itemIdx + 1}.</span>
                        <span className='item-title'>
                          {item[nested.itemTitle]}
                        </span>
                      </div>
                      <div className='nested-item-content'>
                        {nested.fields.map((field, fieldIdx) => {
                          const value = item[field.value];
                          if (!value && value !== 0) return null;

                          return (
                            <p key={fieldIdx}>
                              <strong>{field.label}:</strong>{' '}
                              {formatValue(value, field.format)}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className='card-footer'>
          <button className='btn-delete-record' onClick={handleDeleteClick}>
            🗑️ {config.deleteLabel}
          </button>
        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <DeleteConfirmModal
          fullName={config.deleteConfirmName(data)}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
