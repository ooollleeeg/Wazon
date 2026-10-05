import React, { useState } from 'react';
import '../../styles/TabContent.css';
import '../../styles/RadioMonitoringTab.css';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import SuccessModal from '../modals/SuccessModal';
import LoadingSpinner from '../common/LoadingSpinner';

export const MONITORING_TYPES = [
  'контрольованої території під час проведення закритих нарад (бесід)',
  'під час зустрічей іноземних делегацій, груп та окремих іноземців',
  'плановий р/м контрольованої території',
  "приміщень урядового та спеціального зв'язку",
] as const;

export interface RadioMonitoringRecord {
  id?: number;
  rowNumber?: number;
  monitoringType: string;
  eventDate: string;
  durationHours: number;
  durationMinutes: number;
  totalMinutes?: number;
  durationFormatted?: string;
  department: string;
  equipment: string;
  formattedDate?: string;
}

export interface ReportRow {
  rowNumber: number;
  monitoringType: string;
  eventsCount: number;
  datesFormatted: string;
  totalMinutes: number;
  durationFormatted: string;
  departments: string;
  equipment: string;
  records: RadioMonitoringRecord[];
}

export interface ReportTotals {
  rowNumber: string;
  monitoringType: string;
  eventsCount: number;
  datesFormatted: string;
  totalMinutes: number;
  durationFormatted: string;
  departments: string;
  equipment: string;
}

const initialFormData: RadioMonitoringRecord = {
  monitoringType: MONITORING_TYPES[0],
  eventDate: '',
  durationHours: 0,
  durationMinutes: 0,
  department: '',
  equipment: '',
};

function RadioMonitoringTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'initial' | 'report' | 'all'>('initial');

  // Report and records data
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [totals, setTotals] = useState<ReportTotals | null>(null);
  const [records, setRecords] = useState<RadioMonitoringRecord[]>([]);

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RadioMonitoringRecord>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<RadioMonitoringRecord | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<RadioMonitoringRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(dateStr);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  const formatDurationText = (hours: number, minutes: number) => {
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    const total = h * 60 + m;
    const resH = Math.floor(total / 60);
    const resM = total % 60;
    return `${resH} год ${resM < 10 ? '0' : ''}${resM} хв`;
  };

  const handleFetchData = async (mode: 'report' | 'all' = 'report') => {
    if (mode === 'report') {
      if (!dateFrom || !dateTo) {
        setError('Будь ласка, оберіть період часу (обидві дати)');
        return;
      }

      if (!validateDate(dateFrom) || !validateDate(dateTo)) {
        setError('Невірний формат дати');
        return;
      }

      if (dateFrom > dateTo) {
        setError('Дата "від" не може бути пізніше дати "до"');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const url =
        mode === 'report'
          ? `/api/radio-monitoring?dateFrom=${dateFrom}&dateTo=${dateTo}&mode=report`
          : '/api/radio-monitoring?mode=all';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Помилка отримання даних');
      }

      const data = await response.json();
      setRecords(data.rows || []);
      setReportRows(data.report || []);
      setTotals(data.totals || null);
      setViewMode(mode);
    } catch (err) {
      console.error('Помилка при отриманні даних:', err);
      setError('Помилка при отриманні даних. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleEditRecord = (record: RadioMonitoringRecord) => {
    setEditingId(record.id || null);
    setFormData({
      monitoringType: record.monitoringType || MONITORING_TYPES[0],
      eventDate: record.eventDate || '',
      durationHours: record.durationHours ?? 0,
      durationMinutes: record.durationMinutes ?? 0,
      department: record.department || '',
      equipment: record.equipment || '',
    });
    setShowModal(true);
  };

  const handleViewRecord = (record: RadioMonitoringRecord) => {
    setViewingRecord(record);
    setShowViewModal(true);
  };

  const handleEditFromView = () => {
    if (!viewingRecord) return;
    const target = viewingRecord;
    setShowViewModal(false);
    handleEditRecord(target);
  };

  const handleDeleteFromView = () => {
    if (!viewingRecord) return;
    const target = viewingRecord;
    setShowViewModal(false);
    handleDeleteClick(target);
  };

  const handleDeleteClick = (record: RadioMonitoringRecord) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete || !recordToDelete.id) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/radio-monitoring/${recordToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Помилка при видаленні');
      }

      setShowDeleteModal(false);
      setRecordToDelete(null);
      setSuccessMessage('Запис успішно видалено');
      setShowSuccessModal(true);

      // Оновлюємо дані у поточному режимі перегляду
      if (viewMode !== 'initial') {
        await handleFetchData(viewMode);
      }
    } catch (err) {
      console.error('Помилка при видаленні:', err);
      setError('Помилка при видаленні запису.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === 'durationHours') {
      const val = Math.max(0, parseInt(value, 10) || 0);
      setFormData((prev) => ({ ...prev, durationHours: val }));
    } else if (name === 'durationMinutes') {
      const val = Math.min(59, Math.max(0, parseInt(value, 10) || 0));
      setFormData((prev) => ({ ...prev, durationMinutes: val }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.monitoringType || !formData.eventDate || !formData.department.trim() || !formData.equipment.trim()) {
      setError("Будь ласка, заповніть усі обов'язкові поля");
      return;
    }

    if (formData.durationHours === 0 && formData.durationMinutes === 0) {
      setError('Вкажіть витрачений час (години або хвилини)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const isEditing = !!editingId;
      const url = editingId
        ? `/api/radio-monitoring/${editingId}`
        : '/api/radio-monitoring';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Помилка при збереженні запису');
      }

      setShowModal(false);
      setEditingId(null);
      setFormData(initialFormData);

      setSuccessMessage(
        isEditing ? 'Запис успішно відредаговано' : 'Запис успішно додано',
      );
      setShowSuccessModal(true);

      // Якщо перегляд вже активний, освіжаємо
      if (viewMode !== 'initial') {
        await handleFetchData(viewMode);
      } else {
        // Якщо ще не відкрили, переглянемо всі
        await handleFetchData('all');
      }
    } catch (err) {
      console.error('Помилка:', err);
      setError('Помилка при збереженні запису.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='rm-container'>
      {/* Header */}
      <div className='rm-header'>
        <h2>📻 Радіомоніторинг</h2>
      </div>

      {/* Description */}
      <div className='rm-description'>
        <p>
          Для формування звіту щодо радіомоніторингу, оберіть період часу. Для
          перегляду усіх записів - натисніть кнопку "Переглянути всі". Щоб
          додати новий запис, натисніть кнопку "Додати запис".
        </p>
      </div>

      {/* Controls */}
      <div className='rm-controls'>
        <div className='date-range-picker'>
          <div className='date-group'>
            <label htmlFor='rmDateFrom'>Період з (дата):</label>
            <input
              id='rmDateFrom'
              type='date'
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className='date-group'>
            <label htmlFor='rmDateTo'>по (дата):</label>
            <input
              id='rmDateTo'
              type='date'
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <button
          type='button'
          className='rm-btn-generate-report'
          onClick={() => handleFetchData('report')}
          disabled={loading}
        >
          {loading && viewMode === 'report' ? '⏳ Завантаження...' : '📊 Сформувати звіт'}
        </button>

        <button
          type='button'
          className='rm-btn-view-all'
          onClick={() => handleFetchData('all')}
          disabled={loading}
        >
          {loading && viewMode === 'all' ? '⏳ Завантаження...' : '📋 Переглянути всі'}
        </button>

        <button
          type='button'
          className='rm-btn-add-record'
          onClick={handleOpenAddModal}
          disabled={loading}
        >
          ➕ Додати запис
        </button>
      </div>

      {/* Error Message */}
      {error && <div className='rm-error-message'>{error}</div>}

      {/* Loading Spinner */}
      {loading && (
        <LoadingSpinner
          fullScreen
          size='large'
          label='Завантаження даних радіомоніторингу...'
        />
      )}

      {/* Submitting Spinner */}
      {isSubmitting && (
        <LoadingSpinner
          fullScreen
          size='large'
          label={editingId ? 'Збереження змін...' : 'Додавання запису...'}
        />
      )}

      {/* Initial Empty State */}
      {viewMode === 'initial' && !loading && !error && (
        <div className='rm-empty-state'>
          <div className='empty-icon'>📻</div>
          <p>
            Для формування звіту щодо радіомоніторингу, оберіть період часу та
            натисніть <strong>«Сформувати звіт»</strong>, або натисніть{' '}
            <strong>«Переглянути всі»</strong> для перегляду усіх записів.
          </p>
        </div>
      )}

      {/* REPORT MODE */}
      {viewMode === 'report' && !loading && (
        <div className='rm-section'>
          <div className='rm-section-header'>
            <h3>
              Звіт щодо радіомоніторингу за період {formatDate(dateFrom)} – {formatDate(dateTo)}
            </h3>
            <p className='rm-section-count'>
              Всього заходів за період: {records.length}
            </p>
          </div>

          <div className='rm-table-wrapper'>
            <table className='rm-table'>
              <thead>
                <tr>
                  <th className='rm-col-num'>№ з/п</th>
                  <th className='rm-col-type'>Вид радіомоніторингу</th>
                  <th className='rm-col-count-dates'>Кількість заходів (дати)</th>
                  <th className='rm-col-duration'>Витрачений час</th>
                  <th className='rm-col-dept'>Підрозділи, що проводили перевірку</th>
                  <th className='rm-col-equip'>Апаратура, що застосовувалась</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className='rm-col-num'>{row.rowNumber}</td>
                    <td className='rm-col-type'>{row.monitoringType}</td>
                    <td className='rm-col-count-dates'>{row.datesFormatted}</td>
                    <td className='rm-col-duration'>{row.durationFormatted}</td>
                    <td className='rm-col-dept'>{row.departments}</td>
                    <td className='rm-col-equip'>{row.equipment}</td>
                  </tr>
                ))}
                {totals && (
                  <tr className='rm-totals-row'>
                    <td className='rm-col-num'>{totals.rowNumber}</td>
                    <td className='rm-col-type rm-totals-label'>ПІДСУМОК</td>
                    <td className='rm-col-count-dates'>{totals.eventsCount}</td>
                    <td className='rm-col-duration'>{totals.durationFormatted}</td>
                    <td className='rm-col-dept'>—</td>
                    <td className='rm-col-equip'>—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Detailed records list for the chosen period */}
          <div className='rm-details-section'>
            <div className='rm-details-title'>
              <h4>📋 Деталізований перелік заходів за обраний період ({records.length})</h4>
            </div>

            {records.length === 0 ? (
              <p style={{ color: '#718096', fontStyle: 'italic', margin: 0 }}>
                За вказаний період заходів не зареєстровано.
              </p>
            ) : (
              <div className='rm-table-wrapper'>
                <table className='rm-table'>
                  <thead>
                    <tr>
                      <th className='rm-col-num'>№ з/п</th>
                      <th className='rm-col-type'>Вид р/м</th>
                      <th className='rm-col-date'>Дата заходу</th>
                      <th className='rm-col-duration'>Витрачений час</th>
                      <th className='rm-col-dept'>Підрозділ</th>
                      <th className='rm-col-equip'>Застосована апаратура</th>
                      <th className='rm-col-actions'>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, idx) => (
                      <tr key={r.id || idx}>
                        <td className='rm-col-num'>{r.rowNumber || idx + 1}</td>
                        <td className='rm-col-type'>{r.monitoringType}</td>
                        <td className='rm-col-date'>{formatDate(r.eventDate)}</td>
                        <td className='rm-col-duration'>{r.durationFormatted}</td>
                        <td className='rm-col-dept'>{r.department}</td>
                        <td className='rm-col-equip'>{r.equipment}</td>
                        <td className='rm-col-actions'>
                          <button
                            type='button'
                            className='rm-btn-action'
                            onClick={() => handleViewRecord(r)}
                            title='Переглянути'
                          >
                            👁️
                          </button>
                          <button
                            type='button'
                            className='rm-btn-action'
                            onClick={() => handleEditRecord(r)}
                            title='Редагувати'
                          >
                            ✏️
                          </button>
                          <button
                            type='button'
                            className='rm-btn-action delete'
                            onClick={() => handleDeleteClick(r)}
                            title='Видалити'
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ALL RECORDS MODE */}
      {viewMode === 'all' && !loading && (
        <div className='rm-section'>
          <div className='rm-section-header'>
            <h3>Усі записи про радіомоніторинг (в хронологічному порядку)</h3>
            <p className='rm-section-count'>Знайдено: {records.length} записів</p>
          </div>

          {records.length === 0 ? (
            <div className='rm-empty-state'>
              <div className='empty-icon'>📋</div>
              <p>Записів про радіомоніторинг ще немає. Натисніть кнопку «Додати запис», щоб створити перший запис.</p>
            </div>
          ) : (
            <div className='rm-table-wrapper'>
              <table className='rm-table'>
                <thead>
                  <tr>
                    <th className='rm-col-num'>№ з/п</th>
                    <th className='rm-col-type'>Вид р/м</th>
                    <th className='rm-col-date'>Дата заходу</th>
                    <th className='rm-col-duration'>Витрачений час</th>
                    <th className='rm-col-dept'>Підрозділ</th>
                    <th className='rm-col-equip'>Застосована апаратура</th>
                    <th className='rm-col-actions'>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, idx) => (
                    <tr key={r.id || idx}>
                      <td className='rm-col-num'>{r.rowNumber || idx + 1}</td>
                      <td className='rm-col-type'>{r.monitoringType}</td>
                      <td className='rm-col-date'>{formatDate(r.eventDate)}</td>
                      <td className='rm-col-duration'>{r.durationFormatted}</td>
                      <td className='rm-col-dept'>{r.department}</td>
                      <td className='rm-col-equip'>{r.equipment}</td>
                      <td className='rm-col-actions'>
                        <button
                          type='button'
                          className='rm-btn-action'
                          onClick={() => handleViewRecord(r)}
                          title='Переглянути'
                        >
                          👁️
                        </button>
                        <button
                          type='button'
                          className='rm-btn-action'
                          onClick={() => handleEditRecord(r)}
                          title='Редагувати'
                        >
                          ✏️
                        </button>
                        <button
                          type='button'
                          className='rm-btn-action delete'
                          onClick={() => handleDeleteClick(r)}
                          title='Видалити'
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODAL (Read-only preview) */}
      {showViewModal && viewingRecord && (
        <div
          className='rm-modal-overlay'
          onClick={() => setShowViewModal(false)}
        >
          <div
            className='rm-modal-content'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='rm-modal-header'>
              <h3>👁️ Перегляд запису радіомоніторингу</h3>
              <button
                type='button'
                className='rm-modal-close'
                onClick={() => setShowViewModal(false)}
              >
                ✕
              </button>
            </div>

            <div className='rm-view-body'>
              <div className='rm-view-item'>
                <label>Вид радіомоніторингу</label>
                <strong>{viewingRecord.monitoringType}</strong>
              </div>

              <div className='rm-view-item'>
                <label>Дата проведення заходу</label>
                <strong>{formatDate(viewingRecord.eventDate)}</strong>
              </div>

              <div className='rm-view-item'>
                <label>Витрачений час</label>
                <strong>
                  {formatDurationText(
                    viewingRecord.durationHours,
                    viewingRecord.durationMinutes,
                  )}
                </strong>
              </div>

              <div className='rm-view-item'>
                <label>Підрозділ, що проводив моніторинг</label>
                <strong>{viewingRecord.department}</strong>
              </div>

              <div className='rm-view-item'>
                <label>Застосована апаратура</label>
                <strong>{viewingRecord.equipment}</strong>
              </div>
            </div>

            <div className='rm-view-footer'>
              <button
                type='button'
                className='rm-btn-edit-from-view'
                onClick={handleEditFromView}
              >
                ✏️ Редагувати
              </button>
              <button
                type='button'
                className='rm-btn-delete-from-view'
                onClick={handleDeleteFromView}
              >
                🗑️ Видалити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className='rm-modal-overlay' onClick={() => setShowModal(false)}>
          <div
            className='rm-modal-content'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='rm-modal-header'>
              <h3>
                {editingId
                  ? '✏️ Редагувати запис про радіомоніторинг'
                  : '➕ Додати запис про радіомоніторинг'}
              </h3>
              <button
                type='button'
                className='rm-modal-close'
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className='rm-form'>
              {/* 1 - Вид радіомоніторингу */}
              <div className='rm-form-group'>
                <label htmlFor='rmTypeSelect'>
                  1. Вид радіомоніторингу *
                </label>
                <select
                  id='rmTypeSelect'
                  name='monitoringType'
                  value={formData.monitoringType}
                  onChange={handleInputChange}
                  required
                >
                  {MONITORING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2 - Дата проведення заходу */}
              <div className='rm-form-group'>
                <label htmlFor='rmEventDate'>
                  2. Дата проведення заходу *
                </label>
                <input
                  id='rmEventDate'
                  type='date'
                  name='eventDate'
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* 3 - Витрачений час (години, хвилини) */}
              <div className='rm-form-group'>
                <label>3. Витрачений час (години, хвилини) *</label>
                <div className='rm-time-inputs'>
                  <div className='rm-time-field'>
                    <input
                      type='number'
                      name='durationHours'
                      min='0'
                      max='999'
                      placeholder='0'
                      value={formData.durationHours}
                      onChange={handleInputChange}
                    />
                    <span>год</span>
                  </div>
                  <div className='rm-time-field'>
                    <input
                      type='number'
                      name='durationMinutes'
                      min='0'
                      max='59'
                      placeholder='0'
                      value={formData.durationMinutes}
                      onChange={handleInputChange}
                    />
                    <span>хв</span>
                  </div>
                </div>
              </div>

              {/* 4 - Підрозділ, що проводив моніторинг */}
              <div className='rm-form-group'>
                <label htmlFor='rmDepartment'>
                  4. Підрозділ, що проводив моніторинг *
                </label>
                <input
                  id='rmDepartment'
                  type='text'
                  name='department'
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder='наприклад: ВТЗІ УКЗ ГУНП'
                  required
                />
              </div>

              {/* 5 - Застосована апаратура */}
              <div className='rm-form-group'>
                <label htmlFor='rmEquipment'>
                  5. Застосована апаратура *
                </label>
                <input
                  id='rmEquipment'
                  type='text'
                  name='equipment'
                  value={formData.equipment}
                  onChange={handleInputChange}
                  placeholder='наприклад: Омега-3, РИЧ-1'
                  required
                />
              </div>

              <div className='rm-modal-buttons'>
                <button
                  type='button'
                  className='rm-btn-cancel'
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                  }}
                  disabled={isSubmitting}
                >
                  Скасувати
                </button>
                <button
                  type='submit'
                  className='rm-btn-submit'
                  disabled={isSubmitting}
                >
                  {editingId ? '✓ Зберегти зміни' : '✓ Додати запис'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && recordToDelete && (
        <DeleteConfirmModal
          fullName={`${recordToDelete.monitoringType} (${formatDate(recordToDelete.eventDate)})`}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setRecordToDelete(null);
          }}
          isLoading={isDeleting}
        />
      )}

      {/* Success Notification Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        message={successMessage || ''}
        onClose={() => {
          setShowSuccessModal(false);
          setSuccessMessage(null);
        }}
      />
    </div>
  );
}

export default RadioMonitoringTab;

