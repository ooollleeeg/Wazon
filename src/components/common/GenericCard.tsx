import { useState, useEffect } from 'react';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import { highlightText } from '../../utils/searchUtils';
// @ts-ignore
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
  dateField?: string; // Field for sorting (newer first)
  showPreviousVersions?: boolean; // Show "View previous" button with current version first
  showAllByDefault?: boolean; // Show all records by default (no toggle button)
  hideAllByDefault?: boolean; // Hide all records by default, show only expand button
  hideWhenMoreThan?: number; // Hide all by default when items count exceeds this threshold
  fields: {
    label: string;
    value: string; // Field name in nested item
    format?: 'date' | 'text' | 'badge' | 'link';
    fullWidth?: boolean; // Make field span full width
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
  searchTerm?: string;
  onEdit: () => void;
  onDelete: () => void;
  onClose?: () => void;
  onRefreshData?: () => Promise<void>; // Callback to refresh data after PATCH
  showCloseButton?: boolean;
  shouldExpandAll?: boolean; // Expand all nested sections on mount
  objectType?: string; // Type of object for API calls
}

export default function GenericCard({
  config,
  data,
  searchTerm = '',
  onEdit,
  onDelete,
  onClose,
  onRefreshData,
  showCloseButton = true,
  shouldExpandAll = false,
  objectType,
}: GenericCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Controls visibility of previous versions (toggle button)
  const [expandedPreviousVersions, setExpandedPreviousVersions] = useState<{
    [key: string]: boolean;
  }>(() => {
    // If shouldExpandAll is true, expand all nested sections by default
    if (shouldExpandAll && config.nestedSections) {
      const initialExpanded: { [key: string]: boolean } = {};
      config.nestedSections.forEach((section) => {
        initialExpanded[section.name] = true;
      });
      return initialExpanded;
    }
    return {};
  });

  const formatValue = (value: any, format?: string) => {
    if (!value && value !== 0) return '-';

    switch (format) {
      case 'date': {
        const formattedDate = new Date(value).toLocaleDateString('uk-UA');
        // ✅ Підсвічуємо дату якщо є searchTerm
        return highlightText(formattedDate, searchTerm);
      }
      case 'link': {
        // ✅ Підсвічуємо текст якщо є searchTerm
        const stringValue = String(value);
        const displayValue = highlightText(stringValue, searchTerm);
        if (stringValue.includes('@')) {
          return (
            <a href={`mailto:${stringValue}`} className='value link'>
              {displayValue}
            </a>
          );
        }
        if (stringValue.startsWith('+') || stringValue.startsWith('0')) {
          return (
            <a href={`tel:${stringValue}`} className='value link'>
              {displayValue}
            </a>
          );
        }
        return displayValue;
      }
      case 'badge': {
        // ✅ Підсвічуємо текст якщо є searchTerm
        const stringValue = String(value);
        const displayValue = highlightText(stringValue, searchTerm);
        return <span className='value badge'>{displayValue}</span>;
      }
      default: {
        // ✅ Підсвічуємо текст якщо є searchTerm
        // Перевертаємо число на строку для підсвічування
        const stringValue = String(value);
        const displayValue = highlightText(stringValue, searchTerm);
        return displayValue;
      }
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

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    onDelete();
  };

  const toggleExpandSection = (sectionName: string) => {
    setExpandedPreviousVersions((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const title = getFieldValue(config.title);
  const subtitle = config.subtitle ? getFieldValue(config.subtitle) : null;
  const isSuspended = data?.isProcessingSuspended || false;

  return (
    <>
      <div className={`generic-card ${isSuspended ? 'suspended' : ''}`}>
        {/* HEADER */}
        <div className={`card-header ${isSuspended ? 'suspended' : ''}`}>
          <div className='card-title'>
            <h3>{title}</h3>
            {subtitle && <p className='subtitle'>{subtitle}</p>}
            {isSuspended && (
              <p className='suspension-notice'>
                ⏸️ обробка інформації тимчасово призупинена
              </p>
            )}
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
            const items = sortByDate(data[nested.name] || [], nested.dateField);
            if (!items || items.length === 0) return null;

            const isShowingPreviousVersions =
              expandedPreviousVersions[nested.name];

            // Determine display behavior based on configuration
            let displayItems: any[] = [];
            let showToggleButton = false;
            let buttonLabel = '';

            // Check if should hide based on hideWhenMoreThan threshold
            const shouldHideWhenMoreThan =
              nested.hideWhenMoreThan && items.length > nested.hideWhenMoreThan;

            if (nested.hideAllByDefault || shouldHideWhenMoreThan) {
              // Hide all by default, show expand button
              displayItems = isShowingPreviousVersions ? items : [];
              showToggleButton = items.length > 0;
              buttonLabel = isShowingPreviousVersions
                ? '← Згорнути'
                : `↓ Переглянути (${items.length})`;
            } else if (nested.showAllByDefault) {
              // Show all records by default, no toggle button
              displayItems = items;
              showToggleButton = false;
            } else {
              // Show current version by default (existing behavior)
              displayItems = isShowingPreviousVersions
                ? items
                : items.slice(0, 1);
              const hasPreviousVersions =
                (nested.showPreviousVersions ?? false) && items.length > 1;
              showToggleButton = hasPreviousVersions;
              buttonLabel = isShowingPreviousVersions
                ? '← Приховати попередні'
                : `↓ Переглянути попередні (${items.length - 1})`;
            }

            return (
              <section key={idx} className='card-section nested-section'>
                <h4 className='section-title'>
                  {nested.icon} {nested.title} ({items.length})
                </h4>
                <div className='nested-list'>
                  {displayItems.map((item: any, itemIdx: number) => {
                    const isCurrentVersion =
                      itemIdx === 0 &&
                      !nested.hideAllByDefault &&
                      !shouldHideWhenMoreThan;
                    const isPreviousVersion =
                      itemIdx > 0 &&
                      !nested.hideAllByDefault &&
                      !nested.showAllByDefault &&
                      !shouldHideWhenMoreThan;

                    return (
                      <div
                        key={itemIdx}
                        className={`nested-item ${
                          isPreviousVersion ? 'previous-version' : ''
                        } visible-item`}
                      >
                        <div className='nested-item-header'>
                          <span className='item-number'>{itemIdx + 1}.</span>
                          <span className='item-title'>
                            {item[nested.itemTitle]}
                          </span>
                          {isCurrentVersion && nested.showPreviousVersions && (
                            <span className='badge-current'>Поточний</span>
                          )}
                        </div>
                        <div className='nested-item-content'>
                          {nested.fields.map((field, fieldIdx) => {
                            const value = item[field.value];
                            if (!value && value !== 0) return null;

                            return (
                              <p
                                key={fieldIdx}
                                className={field.fullWidth ? 'full-width' : ''}
                              >
                                <strong>{field.label}:</strong>{' '}
                                {formatValue(value, field.format)}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {showToggleButton && (
                  <button
                    className='btn-toggle-previous'
                    onClick={() => toggleExpandSection(nested.name)}
                  >
                    {buttonLabel}
                  </button>
                )}
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
