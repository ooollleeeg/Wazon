import React, { useState } from 'react';
import '../../styles/TabContent.css';
import '../../styles/NPUResearchTab.css';

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

  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(dateStr);
  };

  const handleGenerateReport = async () => {
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

    setLoading(true);
    setError('');
    setReportData(null);

    try {
      const response = await fetch(
        `/api/npu-research?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      );
      if (!response.ok) {
        throw new Error('Помилка отримання звіту');
      }
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error('Помилка при отриманні звіту:', err);
      setError('Помилка при отриманні звіту. Спробуйте ще раз.');
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

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate || !formData.organName) {
      setError("Обов'язкові поля: Дата початку, Дата кінця, Назва органу");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/npu-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Помилка при додаванні запису');
      }

      const result = await response.json();
      console.log('✅ Запис додано:', result);

      // Очищення форми та закриття модального вікна
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
      setShowModal(false);

      // Оновлення звіту (якщо він відображається)
      if (dateFrom && dateTo) {
        handleGenerateReport();
      }
    } catch (err) {
      console.error('Помилка:', err);
      setError('Помилка при додаванні запису. Спробуйте ще раз.');
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
          onClick={handleGenerateReport}
          disabled={loading}
        >
          {loading ? '⏳ Завантаження...' : 'Сформувати звіт'}
        </button>

        <button
          className='btn-add-record'
          onClick={() => setShowModal(true)}
          disabled={loading}
        >
          ➕ Додати запис
        </button>
      </div>

      {error && <div className='error-message'>{error}</div>}

      {reportData && (
        <div className='report-section'>
          <div className='report-header'>
            <h3>
              Звіт щодо проведених інструментальних досліджень на об'єктах
              інформаційної діяльності, проведених за дорученнями НПУ в період{' '}
              {formatDate(dateFrom)} – {formatDate(dateTo)}
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
                  <th className='col-order'>№ і дата доручення НПУ</th>
                  <th className='col-count'>Приміщення ІК</th>
                  <th className='col-count'>Спец. досл. ПЕОМ</th>
                  <th className='col-count'>ПЕОМ ІК</th>
                  <th className='col-count'>КРТ ІК</th>
                  <th className='col-count'>КСП</th>
                  <th className='col-count'>Актів атестації</th>
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
                  </tr>
                ))}
                <tr className='totals-row'>
                  <td className='col-number'>{reportData.totals.rowNumber}</td>
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
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!reportData && !loading && !error && (
        <div className='empty-state'>
          <p>Звіт буде сформований після вибору періоду та натискання кнопки</p>
        </div>
      )}

      {/* MODAL WINDOW FOR ADDING RECORDS */}
      {showModal && (
        <div className='modal-overlay' onClick={() => setShowModal(false)}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h3>➕ Додати запис про дослідження в органах НПУ</h3>
              <button
                className='modal-close'
                onClick={() => setShowModal(false)}
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
                    <label>Дата кінця *</label>
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

              {/* Organ Info Section */}
              <div className='form-section'>
                <h4>Інформація про орган НПУ</h4>
                <div className='form-grid'>
                  <div className='form-group'>
                    <label>Назва органу НП України *</label>
                    <input
                      type='text'
                      name='organName'
                      value={formData.organName}
                      onChange={handleInputChange}
                      placeholder='Наприклад: ГУНП в Воронезькій області'
                      required
                    />
                  </div>
                </div>

                <div className='form-grid two-column'>
                  <div className='form-group'>
                    <label>№ доручення НПУ</label>
                    <input
                      type='text'
                      name='orderNumber'
                      value={formData.orderNumber}
                      onChange={handleInputChange}
                      placeholder='Наприклад: 1234'
                    />
                  </div>
                  <div className='form-group'>
                    <label>Дата доручення</label>
                    <input
                      type='date'
                      name='orderDate'
                      value={formData.orderDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Research Counts Section */}
              <div className='form-section'>
                <h4>Кількість проведених інструментальних досліджень</h4>
                <div className='form-grid three-column'>
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
                    <label>Спец. дослідження ПЕОМ</label>
                    <input
                      type='number'
                      name='specialResearch'
                      value={formData.specialResearch}
                      onChange={handleInputChange}
                      min='0'
                    />
                  </div>
                  <div className='form-group'>
                    <label>ІК ПЕОМ </label>
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
                <button
                  type='button'
                  className='btn-cancel'
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Скасувати
                </button>
                <button
                  type='submit'
                  className='btn-submit'
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '⏳ Збереження...' : '✓ Додати запис'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default NPUResearchTab;
