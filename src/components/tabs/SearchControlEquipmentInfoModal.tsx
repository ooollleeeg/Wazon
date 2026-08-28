import React, { useState } from 'react';
import './styles/SearchControlEquipmentInfoModal.css';
import {
  getVerificationStatus,
  getStatusIcon,
  getStatusLabel,
  formatDaysRemaining,
  groupVerificationsByPart,
  getVerificationYears,
  isVerificationOlderThan10Years,
} from '../../utils/verificationStatusUtils';
import { EquipmentItem } from '../../types/equipment';

interface SearchControlEquipmentInfoModalProps {
  equipment: EquipmentItem | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SearchControlEquipmentInfoModal: React.FC<
  SearchControlEquipmentInfoModalProps
> = ({ equipment, onClose, onEdit, onDelete }) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  if (!equipment) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA');
  };

  // ✅ Отримуємо групи верифікацій за компонентами
  const verificationGroups = groupVerificationsByPart(equipment.verifications);
  const availableYears = getVerificationYears(equipment.verifications);

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div
        className='modal-content search-control-info-modal'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal-header'>
          <h2>{equipment.name}</h2>
          <button className='modal-close' onClick={onClose} aria-label='Close'>
            ✕
          </button>
        </div>

        <div className='modal-body'>
          {/* Основна інформація */}
          <section className='info-section'>
            <h3>📋 Основна інформація</h3>
            <div className='info-grid'>
              <div className='info-item'>
                <label>Категорія:</label>
                <strong>{equipment.category || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Назва обладнання:</label>
                <strong>{equipment.name || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Серійний номер:</label>
                <strong>{equipment.serialNumber || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Інвентарний номер:</label>
                <strong>{equipment.invertarNumber || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Рік випуску:</label>
                <strong>{equipment.releaseYear || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Технічний стан:</label>
                <strong>{equipment.technicalCondition || '—'}</strong>
              </div>
              <div className='info-item'>
                <label>Ціна за одиницю:</label>
                <strong>
                  {equipment.pricePerUnit
                    ? `${Number(equipment.pricePerUnit).toLocaleString('uk-UA')} грн.`
                    : '—'}
                </strong>
              </div>
              {equipment.notes && (
                <div className='info-item full-width'>
                  <label>Примітки:</label>
                  <p>{equipment.notes}</p>
                </div>
              )}
            </div>
          </section>

          {/* Метрологічна повірка */}
          {equipment.category === 'Контрольно-вимірювальна техніка' &&
            equipment.verifications &&
            equipment.verifications.length > 0 && (
              <section className='info-section'>
                <div className='verification-section-header'>
                  <h3>📊 Метрологічна повірка</h3>

                  {/* ✅ Фільтр по рокам */}
                  {availableYears.length > 1 && (
                    <div className='verification-filter'>
                      <label htmlFor='year-filter'>Фільтр по рокам:</label>
                      <select
                        id='year-filter'
                        value={selectedYear ?? ''}
                        onChange={(e) =>
                          setSelectedYear(
                            e.target.value ? parseInt(e.target.value) : null,
                          )
                        }
                      >
                        <option value=''>
                          Всі роки ({equipment.verifications.length})
                        </option>
                        {availableYears.map((year) => {
                          const countForYear = equipment.verifications!.filter(
                            (v) =>
                              new Date(v.verificationDate).getFullYear() ===
                              year,
                          ).length;
                          return (
                            <option key={year} value={year}>
                              {year} ({countForYear})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>

                <div className='verifications-list'>
                  {verificationGroups.map((group) => {
                    // ✅ Фільтруємо верифікації групи по рокам
                    const filteredGroupVerifications = selectedYear
                      ? group.verifications.filter(
                          (v) =>
                            new Date(v.verificationDate).getFullYear() ===
                            selectedYear,
                        )
                      : group.verifications;

                    if (filteredGroupVerifications.length === 0) return null;

                    return (
                      <div
                        key={group.devicePart}
                        className='verification-group'
                      >
                        {/* Назва компоненту */}
                        <div className='group-header'>
                          <h4 className='component-name'>{group.devicePart}</h4>
                          <span
                            className={`component-status ${group.isActive ? 'active' : 'inactive'}`}
                          >
                            {group.isActive
                              ? '✅ Чинне'
                              : '⚠️ Втратило чинність'}
                          </span>
                        </div>

                        {/* ✅ ОСТАННЄ свідоцтво - виділено */}
                        {filteredGroupVerifications.includes(group.latest) && (
                          <div
                            className={`verification-record latest verification-${group.latestStatus}`}
                          >
                            <div className='latest-badge'>ОСТАННЄ</div>
                            <VerificationDetails
                              verification={group.latest}
                              formatDate={formatDate}
                            />
                          </div>
                        )}

                        {/* ✅ АРХІВНІ свідоцтва - згорнуто */}
                        {group.archivedCount > 0 &&
                          (filteredGroupVerifications.length > 1 ||
                            selectedYear) && (
                            <details className='archived-verifications'>
                              <summary>
                                📋 Архівні свідоцтва (
                                {filteredGroupVerifications.length - 1})
                              </summary>
                              <div className='archived-list'>
                                {filteredGroupVerifications
                                  .slice(1)
                                  .map((v) => {
                                    const statusInfo = getVerificationStatus(
                                      v.validUntil,
                                    );
                                    const isOld =
                                      isVerificationOlderThan10Years(
                                        v.verificationDate,
                                      );

                                    return (
                                      <div
                                        key={v.id}
                                        className={`verification-record archived verification-${statusInfo.status}${isOld ? ' old-verification' : ''}`}
                                      >
                                        {isOld && (
                                          <div className='old-badge'>
                                            10+ років
                                          </div>
                                        )}
                                        <VerificationDetails
                                          verification={v}
                                          formatDate={formatDate}
                                        />
                                      </div>
                                    );
                                  })}
                              </div>
                            </details>
                          )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
        </div>

        <div className='modal-footer'>
          <button className='btn-edit' onClick={onEdit}>
            ✏️ Редагувати
          </button>
          <button className='btn-delete' onClick={onDelete}>
            🗑️ Видалити
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ Компонент для відображення деталей верифікації
interface VerificationDetailsProps {
  verification: any;
  formatDate: (dateStr: string) => string;
}

const VerificationDetails: React.FC<VerificationDetailsProps> = ({
  verification,
  formatDate,
}) => {
  const statusInfo = getVerificationStatus(verification.validUntil);

  return (
    <div className='verification-info'>
      <div className='info-row'>
        <label>Серійний номер:</label>
        <strong>{verification.serialNumber || '—'}</strong>
      </div>
      <div className='info-row'>
        <label>Реєстраційний номер:</label>
        <strong>{verification.certificateRegNumber || '—'}</strong>
      </div>
      <div className='info-row'>
        <label>Дата реєстрації свідоцтва:</label>
        <strong>{formatDate(verification.verificationDate)}</strong>
      </div>
      <div className='info-row validity-row'>
        <label>Дійсне до:</label>
        <div className='validity-info'>
          <strong className={`validity-date status-${statusInfo.status}`}>
            {formatDate(verification.validUntil)}
          </strong>
          <span
            className={`days-remaining status-${statusInfo.status}`}
            title={getStatusLabel(statusInfo.status)}
          >
            {getStatusIcon(statusInfo.status)}{' '}
            {formatDaysRemaining(statusInfo.days)}
          </span>
        </div>
      </div>
      {verification.verificationCost && (
        <div className='info-row'>
          <label>Вартість:</label>
          <strong>
            {verification.verificationCost.toLocaleString('uk-UA')} грн
          </strong>
        </div>
      )}
    </div>
  );
};

export default SearchControlEquipmentInfoModal;
