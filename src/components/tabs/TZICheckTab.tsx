// import { useState, useEffect } from 'react';

import React, { useState } from 'react';
import '../../styles/TabContent.css';
import '../../styles/TZICheckTab.css';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import SuccessModal from '../modals/SuccessModal';
import LoadingSpinner from '../common/LoadingSpinner';

interface TZICheckRecord {
  id?: number;
  rowNumber?: number | string;
  checkType: string; //вид перевірки//
  checkOrganName: string; //орган, що проводив перевірку//
  organName: string; //підрозділ, що перевіріявся//
  startDate: string;
  endDate: string;
  violationFirstCategory: number; //порушення першої категорії//
  violationSecondCategory: number; //порушення другої категорії//
  violationThirdCategory: number; //порушення третьої категорії//
  detailsViolation?: string; //деталі порушень//
  holdAccountable?: string; //притягнення до відповідальності за порушення//
}

interface ReportData {
  success: boolean;
  dateFrom: string | null;
  dateTo: string | null;
  rows: TZICheckRecord[];
  totals: TZICheckRecord;
}

function TZICheckTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<TZICheckRecord>({
    checkType: '',
    checkOrganName: '',
    organName: '',
    startDate: '',
    endDate: '',
    violationFirstCategory: 0,
    violationSecondCategory: 0,
    violationThirdCategory: 0,
    detailsViolation: '',
    holdAccountable: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'report' | 'all'>('report');
  const [editingId, setEditingId] = useState<number | null>(null);

  // States for view modal (read-only preview)
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<TZICheckRecord | null>(
    null,
  );

  // States for delete confirmation modal and success modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<TZICheckRecord | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(dateStr);
  };

  const handleGenerateReport = async (mode: 'report' | 'all' = viewMode) => {
    if (mode === 'report') {
      if (!dateFrom || !dateTo) {
        setError('Будь ласка, виберіть обидві дати');
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
    setReportData(null);
    setViewMode(mode);

    try {
      const url =
        mode === 'report'
          ? `/api/npu-research?dateFrom=${dateFrom}&dateTo=${dateTo}`
          : '/api/npu-research';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Помилка отримання даних');
      }
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error('Помилка при отриманні даних:', err);
      setError('Помилка при отриманні даних. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const numericFields = [
      'violationFirstCategory',
      'violationSecondCategory',
      'violationThirdCategory',
    ];

    setFormData((prev) => ({
      ...prev,
      [name]:
        numericFields.includes(name) && value
          ? parseInt(value, 10) || 0
          : value,
    }));
  };

  const handleEdit = (row: TZICheckRecord) => {
    setEditingId(row.id || null);
    setFormData({
      checkType: row.checkType,
      checkOrganName: row.checkOrganName,
      organName: row.organName,
      startDate: row.startDate,
      endDate: row.endDate,
      violationFirstCategory: row.violationFirstCategory,
      violationSecondCategory: row.violationSecondCategory,
      violationThirdCategory: row.violationThirdCategory,
      detailsViolation: row.detailsViolation,
      holdAccountable: row.holdAccountable,
    });
    setShowModal(true);
  };

  const handleViewRecord = (row: TZICheckRecord) => {
    setViewingRecord(row);
    setShowViewModal(true);
  };

  const handleEditFromView = () => {
    if (!viewingRecord) return;
    setShowViewModal(false);
    handleEdit(viewingRecord);
  };

  const handleDeleteFromView = () => {
    if (!viewingRecord) return;
    setShowViewModal(false);
    handleDeleteClick(viewingRecord);
  };

  const handleDeleteClick = (row: TZICheckRecord) => {
    setRecordToDelete(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete || !recordToDelete.id) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tzi-check/${recordToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Помилка при видаленні');

      setShowDeleteModal(false);
      setRecordToDelete(null);
      setSuccessMessage('Запис успішно видалено');
      setShowSuccessModal(true);

      await handleGenerateReport(viewMode);
    } catch (err) {
      console.error('Помилка при видаленні:', err);
      setError('Помилка при видаленні запису.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate || !formData.organName) {
      setError("Обов'язкові поля: Дата початку, Дата кінця, Назва органу");
      return;
    }

    const isEditing = !!editingId;
    setIsSubmitting(true);
    setError('');

    try {
      const url = editingId ? `/api/tzi-check/${editingId}` : '/api/tzi-check';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Помилка при збереженні запису');
      }

      setFormData({
        checkType: '',
        checkOrganName: '',
        organName: '',
        startDate: '',
        endDate: '',
        violationFirstCategory: 0,
        violationSecondCategory: 0,
        violationThirdCategory: 0,
        detailsViolation: '',
        holdAccountable: '',
      });
      setEditingId(null);
      setShowModal(false);

      setSuccessMessage(
        isEditing ? 'Запис успішно відредаговано' : 'Запис успішно додано',
      );
      setShowSuccessModal(true);

      await handleGenerateReport(viewMode);
    } catch (err) {
      console.error('Помилка:', err);
      setError('Помилка при збереженні запису.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='tzi-check-container'>
      <div className='tzi-check-header'>
        <h2>✓ Відомості щодо перевірок стану ТЗІ та контролю заходів з ТЗІ</h2>
      </div>

      <div className='npu-description'>
        <p>
          Для формування звіту щодо перевірок стану ТЗІ та контролю заходів з
          ТЗІ, оберіть звітний період часу. Щоб додати новий запис, натисніть
          відповідну кнопку.
        </p>
      </div>

      <div className='npu-controls'>
        <div className='date-range-picker'>
          <div className='date-group'>
            <label htmlFor='dateFrom'>Період з (дата):</label>
            <input
              id='dateFrom'
              type='date'
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className='date-group'>
            <label htmlFor='dateTo'>по (дата):</label>
            <input
              id='dateTo'
              type='date'
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <button
          className='btn-generate-report'
          onClick={() => handleGenerateReport('report')}
          disabled={loading}
        >
          {loading ? '⏳ Завантаження...' : 'Сформувати звіт'}
        </button>

        <button
          className='btn-view-all'
          onClick={() => handleGenerateReport('all')}
          disabled={loading}
        >
          📋 Переглянути всі
        </button>

        <button
          className='btn-add-record'
          onClick={() => {
            setEditingId(null);
            setFormData({
              checkType: '',
              checkOrganName: '',
              organName: '',
              startDate: '',
              endDate: '',
              violationFirstCategory: 0,
              violationSecondCategory: 0,
              violationThirdCategory: 0,
              detailsViolation: '',
              holdAccountable: '',
            });
            setShowModal(true);
          }}
          disabled={loading}
        >
          ➕ Додати запис
        </button>
      </div>

      {error && <div className='error-message'>{error}</div>}

      {/* Loading Spinner */}
      {loading && (
        <div className='npu-loading-wrapper'>
          <LoadingSpinner label='Завантаження перевірок ТЗІ...' />
        </div>
      )}

      {reportData && !loading && (
        <div className='report-section'>
          <div className='report-header'>
            <h3>
              {viewMode === 'report'
                ? `Звіт щодо проведених перевірок стану ТЗІ в період ${formatDate(dateFrom)} – ${formatDate(dateTo)}`
                : 'Всі записи щодо проведених перевірок стану ТЗІ'}
            </h3>
            <p className='report-count'>
              Знайдено: {reportData.rows.length} записів
            </p>
          </div>

          <div className='table-wrapper'>
            <table className='npu-report-table'>
              <thead>
                <tr>
                  <th className='col-number'>№ з/п</th>
                  <th className='col-check-type'>Тип перевірки</th>
                  <th className='col-check-organ'>Хто первіряв</th>
                  <th className='col-organ'>Кого перевіряли</th>
                  <th className='col-date'>Період проведення</th>

                  {viewMode === 'report' && (
                    <>
                      <th className='col-count'>Поруш. І кат.</th>
                      <th className='col-count'>Поруш. ІІ кат.</th>
                      <th className='col-count'>Поруш. ІІІ кат.</th>
                      <th className='col-order'>Зміст порушень</th>
                      <th className='col-order'>
                        Притягнуто до відповідальності
                      </th>
                    </>
                  )}
                  <th className='col-actions'>Дії</th>
                </tr>
              </thead>
              <tbody>
                {reportData.rows.map((row) => (
                  <tr key={`${row.id || row.rowNumber}`}>
                    <td className='col-number'>{row.rowNumber}</td>
                    <td className='col-check-type'>{row.checkType}</td>
                    <td className='col-check-organ'>{row.checkOrganName}</td>
                    <td className='col-organ'>{row.organName}</td>
                    <td className='col-date'>
                      {formatDate(row.startDate)} – {formatDate(row.endDate)}
                    </td>

                    {viewMode === 'report' && (
                      <>
                        <td className='col-count'>
                          {row.violationFirstCategory}
                        </td>
                        <td className='col-count'>
                          {row.violationSecondCategory}
                        </td>
                        <td className='col-count'>
                          {row.violationThirdCategory}
                        </td>
                        <td className='col-count'>{row.detailsViolation}</td>
                        <td className='col-count'>{row.holdAccountable}</td>
                      </>
                    )}
                    <td className='col-actions'>
                      <button
                        className='btn-action-view'
                        onClick={() => handleViewRecord(row)}
                        title='Переглянути'
                      >
                        👁️
                      </button>
                      <button
                        className='btn-action-delete'
                        onClick={() => handleDeleteClick(row)}
                        title='Видалити'
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {viewMode === 'report' && (
                  <tr className='totals-row'>
                    <td className='col-number'>
                      {reportData.totals.rowNumber}
                    </td>
                    <td className='col-date'>{reportData.totals.organName}</td>

                    <td colSpan={2} className='totals-label'>
                      ПІДСУМОК
                    </td>
                    <td className='col-count'>
                      {reportData.totals.violationFirstCategory}
                    </td>
                    <td className='col-count'>
                      {reportData.totals.violationSecondCategory}
                    </td>
                    <td className='col-count'>
                      {reportData.totals.violationThirdCategory}
                    </td>

                    {/* <td className='col-actions'></td> */}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!reportData && !loading && !error && (
        <div className='empty-state'>
          <p>
            Звіт буде сформований після вибору періоду та натискання кнопки.
            Також ви можете переглянуте всі записи
          </p>
        </div>
      )}

      {/* VIEW MODAL (read-only preview) */}
      {showViewModal && viewingRecord && (
        <div className='modal-overlay' onClick={() => setShowViewModal(false)}>
          <div
            className='modal-content npu-view-modal'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='modal-header'>
              <h3>👁️ Перегляд запису</h3>
              <button
                className='modal-close'
                onClick={() => setShowViewModal(false)}
              >
                ✕
              </button>
            </div>

            <div className='npu-view-body'>
              <div className='view-section'>
                <h4>Період проведення</h4>
                <div className='view-grid two-column'>
                  <div className='view-item'>
                    <label>Дата початку:</label>
                    <strong>{formatDate(viewingRecord.startDate)}</strong>
                  </div>
                  <div className='view-item'>
                    <label>Дата закінчення:</label>
                    <strong>{formatDate(viewingRecord.endDate)}</strong>
                  </div>
                </div>
              </div>

              <div className='view-section'>
                <h4>Орган Національної поліції України</h4>
                <div className='view-item'>
                  <label>Назва органу НПУ:</label>
                  <strong>{viewingRecord.organName}</strong>
                </div>
              </div>

              <div className='view-section'>
                <h4>Доручення НПУ</h4>
                <div className='view-grid two-column'>
                  <div className='view-item'>
                    <label>Номер доручення:</label>
                    <strong>{viewingRecord.orderNumber || '—'}</strong>
                  </div>
                  <div className='view-item'>
                    <label>Дата доручення:</label>
                    <strong>
                      {viewingRecord.orderDate
                        ? formatDate(viewingRecord.orderDate)
                        : '—'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className='view-section'>
                <h4>Кількість проведених досліджень за видами</h4>
                <div className='view-grid two-column'>
                  <div className='view-item'>
                    <label>Приміщення ІК:</label>
                    <strong>{viewingRecord.spInstrumental}</strong>
                  </div>
                  <div className='view-item'>
                    <label>Спеціальні дослідження ПЕОМ:</label>
                    <strong>{viewingRecord.specialResearch}</strong>
                  </div>
                  <div className='view-item'>
                    <label>ПЕОМ ІК:</label>
                    <strong>{viewingRecord.peomInstrumental}</strong>
                  </div>
                  <div className='view-item'>
                    <label>КРТ ІК:</label>
                    <strong>{viewingRecord.krtInstrumental}</strong>
                  </div>
                  <div className='view-item'>
                    <label>КСП:</label>
                    <strong>{viewingRecord.ksp}</strong>
                  </div>
                  <div className='view-item'>
                    <label>Акти атестації:</label>
                    <strong>{viewingRecord.attestationActs}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className='modal-footer npu-view-footer'>
              <button
                className='btn-edit-from-view'
                onClick={handleEditFromView}
              >
                ✏️ Редагувати
              </button>
              <button
                className='btn-delete-from-view'
                onClick={handleDeleteFromView}
              >
                🗑️ Видалити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WINDOW FOR ADDING / EDITING RECORDS */}
      {showModal && (
        <div className='modal-overlay' onClick={() => setShowModal(false)}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h3>
                {editingId
                  ? '✏️ Редагувати запис'
                  : '➕ Додати запис щодо проведення перевірки стану ТЗІ'}
              </h3>
              <button
                className='modal-close'
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className='npu-form'>
              {/* Date Range Section */}
              <div className='form-section'>
                <h4>Період проведення</h4>
                {/* <div className='form-grid two-column'>
                  <div className='form-group'>
                    <label>Дата початку *</label>
                    <input
                      type='date'
                      name='startDate'
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className='form-group'>
                    <label>Дата закінчення *</label>
                    <input
                      type='date'
                      name='endDate'
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div> */}
              </div>

              {/* Organ Name Section */}
              <div className='form-section'>
                <h4>Орган Національної поліції України</h4>
                <div className='form-group'>
                  <label>Назва органу НПУ *</label>
                  <input
                    type='text'
                    name='organName'
                    value={formData.organName}
                    onChange={handleInputChange}
                    placeholder='наприклад: ГУНП в Одеській області'
                    required
                  />
                </div>
              </div>

              {/* Order Info Section */}
              {/* <div className='form-section'>
                <h4>Доручення НПУ (за наявності)</h4>
                <div className='form-grid two-column'>
                  <div className='form-group'>
                    <label>Номер доручення</label>
                    <input
                      type='text'
                      name='orderNumber'
                      value={formData.orderNumber || ''}
                      onChange={handleInputChange}
                      placeholder='наприклад: 123/45'
                    />
                  </div>
                  <div className='form-group'>
                    <label>Дата доручення</label>
                    <input
                      type='date'
                      name='orderDate'
                      value={formData.orderDate || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div> */}

              {/* Research Types Section */}
              {/* <div className='form-section'>
                <h4>Кількість проведених досліджень за видами</h4>
                <div className='form-grid two-column'>
                  <div className='form-group'>
                    <label>Приміщення ІК</label>
                    <input
                      type='number'
                      name='spInstrumental'
                      value={formData.spInstrumental}
                      onChange={handleInputChange}
                      min='0'
                    />
                  </div>
                  <div className='form-group'>
                    <label>Спеціальні дослідження ПЕОМ</label>
                    <input
                      type='number'
                      name='specialResearch'
                      value={formData.specialResearch}
                      onChange={handleInputChange}
                      min='0'
                    />
                  </div>
                  <div className='form-group'>
                    <label>ПЕОМ ІК</label>
                    <input
                      type='number'
                      name='peomInstrumental'
                      value={formData.peomInstrumental}
                      onChange={handleInputChange}
                      min='0'
                    />
                  </div>
                  <div className='form-group'>
                    <label>КРТ ІК</label>
                    <input
                      type='number'
                      name='krtInstrumental'
                      value={formData.krtInstrumental}
                      onChange={handleInputChange}
                      min='0'
                    />
                  </div>
                  <div className='form-group'>
                    <label>КСП</label>
                    <input
                      type='number'
                      name='ksp'
                      value={formData.ksp}
                      onChange={handleInputChange}
                      min='0'
                    />
                  </div>
                  <div className='form-group'>
                    <label>Акти атестації</label>
                    <input
                      type='number'
                      name='attestationActs'
                      value={formData.attestationActs}
                      onChange={handleInputChange}
                      min='0'
                    />
                  </div>
                </div>
              </div> */}

              <div className='modal-buttons'>
                {isSubmitting ? (
                  <div className='modal-submitting-status'>
                    <LoadingSpinner
                      size='small'
                      label={
                        editingId ? 'Збереження змін...' : 'Додавання запису...'
                      }
                    />
                  </div>
                ) : (
                  <>
                    <button
                      type='button'
                      className='btn-cancel'
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
                      className='btn-submit'
                      disabled={isSubmitting}
                    >
                      {editingId ? '✓ Зберегти зміни' : '✓ Додати запис'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && recordToDelete && (
        <DeleteConfirmModal
          fullName={`${recordToDelete.organName} (${formatDate(recordToDelete.startDate)} – ${formatDate(recordToDelete.endDate)})`}
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

export default TZICheckTab;
