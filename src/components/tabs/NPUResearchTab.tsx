import React, { useState } from 'react';
import '../../styles/TabContent.css';
import '../../styles/NPUResearchTab.css';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import SuccessModal from '../modals/SuccessModal';
import LoadingSpinner from '../common/LoadingSpinner';

interface NPURecord {
  id?: number;
  rowNumber?: number | string;
  startDate: string;
  endDate: string;
  organName: string;
  orderNumber?: string;
  orderDate?: string;
  spInstrumental: number;
  specialResearch: number;
  peomInstrumental: number;
  krtInstrumental: number;
  ksp: number;
  attestationActs: number;
}

interface ReportData {
  success: boolean;
  dateFrom: string | null;
  dateTo: string | null;
  rows: NPURecord[];
  totals: NPURecord;
}

function NPUResearchTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<NPURecord>({
    startDate: '',
    endDate: '',
    organName: '',
    orderNumber: '',
    orderDate: '',
    spInstrumental: 0,
    specialResearch: 0,
    peomInstrumental: 0,
    krtInstrumental: 0,
    ksp: 0,
    attestationActs: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'report' | 'all'>('report');
  const [editingId, setEditingId] = useState<number | null>(null);

  // States for delete confirmation modal and success modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<NPURecord | null>(null);
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
      'spInstrumental',
      'specialResearch',
      'peomInstrumental',
      'krtInstrumental',
      'ksp',
      'attestationActs',
    ];

    setFormData((prev) => ({
      ...prev,
      [name]:
        numericFields.includes(name) && value
          ? parseInt(value, 10) || 0
          : value,
    }));
  };

  const handleEdit = (row: NPURecord) => {
    setEditingId(row.id || null);
    setFormData({
      startDate: row.startDate,
      endDate: row.endDate,
      organName: row.organName,
      orderNumber: row.orderNumber || '',
      orderDate: row.orderDate || '',
      spInstrumental: row.spInstrumental,
      specialResearch: row.specialResearch,
      peomInstrumental: row.peomInstrumental,
      krtInstrumental: row.krtInstrumental,
      ksp: row.ksp,
      attestationActs: row.attestationActs,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (row: NPURecord) => {
    setRecordToDelete(row);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete || !recordToDelete.id) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/npu-research/${recordToDelete.id}`, {
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
      const url = editingId
        ? `/api/npu-research/${editingId}`
        : '/api/npu-research';
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
        startDate: '',
        endDate: '',
        organName: '',
        orderNumber: '',
        orderDate: '',
        spInstrumental: 0,
        specialResearch: 0,
        peomInstrumental: 0,
        krtInstrumental: 0,
        ksp: 0,
        attestationActs: 0,
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
    <div className='npu-research-container'>
      <div className='npu-header'>
        <h2>⚗️ Дослідження за дорученнями НПУ</h2>
      </div>

      <div className='npu-description'>
        <p>
          Для формування звіту щодо інструментальних досліджень на об'єктах
          інформаційної діяльності, проведених за дорученнями Національної
          поліції України, оберіть період часу або додайте новий запис.
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
              startDate: '',
              endDate: '',
              organName: '',
              orderNumber: '',
              orderDate: '',
              spInstrumental: 0,
              specialResearch: 0,
              peomInstrumental: 0,
              krtInstrumental: 0,
              ksp: 0,
              attestationActs: 0,
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
          <LoadingSpinner label='Завантаження досліджень НПУ...' />
        </div>
      )}

      {reportData && !loading && (
        <div className='report-section'>
          <div className='report-header'>
            <h3>
              {viewMode === 'report'
                ? `Звіт щодо проведених інструментальних досліджень за дорученнями НПУ в період ${formatDate(dateFrom)} – ${formatDate(dateTo)}`
                : 'Всі записи про дослідження за дорученнями НПУ'}
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
                  <th className='col-date'>Період проведення</th>
                  <th className='col-organ'>Назва органу НП України</th>

                  {viewMode === 'report' && (
                    <>
                      <th className='col-order'>№ і дата доручення НПУ</th>
                      <th className='col-count'>Приміщення ІК</th>
                      <th className='col-count'>Спец. досл. ПЕОМ</th>
                      <th className='col-count'>ПЕОМ ІК</th>
                      <th className='col-count'>КРТ ІК</th>
                      <th className='col-count'>КСП</th>
                      <th className='col-count'>Актів атестації</th>
                    </>
                  )}
                  <th className='col-actions'>Дії</th>
                </tr>
              </thead>
              <tbody>
                {reportData.rows.map((row) => (
                  <tr key={`${row.id || row.rowNumber}`}>
                    <td className='col-number'>{row.rowNumber}</td>
                    <td className='col-date'>
                      {formatDate(row.startDate)} – {formatDate(row.endDate)}
                    </td>
                    <td className='col-organ'>{row.organName}</td>

                    {viewMode === 'report' && (
                      <>
                        <td className='col-order'>
                          {row.orderNumber
                            ? `${row.orderNumber} від ${formatDate(row.orderDate || '')}`
                            : '–'}
                        </td>
                        <td className='col-count'>{row.spInstrumental}</td>
                        <td className='col-count'>{row.specialResearch}</td>
                        <td className='col-count'>{row.peomInstrumental}</td>
                        <td className='col-count'>{row.krtInstrumental}</td>
                        <td className='col-count'>{row.ksp}</td>
                        <td className='col-count'>{row.attestationActs}</td>
                      </>
                    )}
                    <td className='col-actions'>
                      <button
                        className='btn-action-edit'
                        onClick={() => handleEdit(row)}
                        title='Редагувати'
                      >
                        ✏️
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
                      {reportData.totals.spInstrumental}
                    </td>
                    <td className='col-count'>
                      {reportData.totals.specialResearch}
                    </td>
                    <td className='col-count'>
                      {reportData.totals.peomInstrumental}
                    </td>
                    <td className='col-count'>
                      {reportData.totals.krtInstrumental}
                    </td>
                    <td className='col-count'>{reportData.totals.ksp}</td>
                    <td className='col-count'>
                      {reportData.totals.attestationActs}
                    </td>
                    <td className='col-actions'></td>
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
            Звіт буде сформований після вибору періоду та натискання кнопки або
            перегляньте всі записи
          </p>
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
                  : '➕ Додати запис про дослідження в органах НПУ'}
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
                <div className='form-grid two-column'>
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
                </div>
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
              <div className='form-section'>
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
              </div>

              {/* Research Types Section */}
              <div className='form-section'>
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
              </div>

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

export default NPUResearchTab;
