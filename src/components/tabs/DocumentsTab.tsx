import React, { useState } from 'react';
import '../../styles/TabContent.css';
import '../../styles/GUNPResearchTab.css';

interface ReportRow {
  rowNumber: number;
  category: string;
  apparatus: number;
  territorial: number;
  total: number;
}

interface ReportData {
  dateFrom: string;
  dateTo: string;
  rows: ReportRow[];
}

function DocumentsTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (date: string) => {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year}`;
  };

  const handleGenerateReport = async () => {
    if (!dateFrom || !dateTo) {
      setError('Будь ласка, виберіть обидві дати');
      return;
    }
    if (dateFrom > dateTo) {
      setError('Дата "від" не може бути пізніше дати "до"');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/documents-report?dateFrom=${encodeURIComponent(
          dateFrom,
        )}&dateTo=${encodeURIComponent(dateTo)}`,
      );
      if (!response.ok) {
        throw new Error('Помилка отримання звіту');
      }
      setReportData(await response.json());
    } catch (err) {
      console.error('Помилка при отриманні звіту:', err);
      setReportData(null);
      setError('Помилка при отриманні звіту. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='gunp-research-container documents-report-container'>
      <div className='gunp-header'>
        <h2>
          Кількість підготовлених документів з ТЗІ на об'єктах інформаційної
          діяльності
        </h2>
      </div>

      <div className='gunp-description'>
        <p>
          Для формування звіту щодо кількісних показників підготовлених
          документів з ТЗІ на ОІД, оберіть, будь ласка, відповідний період часу.
        </p>
      </div>

      <div className='gunp-controls'>
        <div className='date-range-picker'>
          <div className='date-group'>
            <label htmlFor='documents-date-from'>Період з (дата):</label>
            <input
              id='documents-date-from'
              type='date'
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              disabled={loading}
            />
          </div>
          <div className='date-group'>
            <label htmlFor='documents-date-to'>по (дата):</label>
            <input
              id='documents-date-to'
              type='date'
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
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
      </div>

      {error && <div className='error-message'>{error}</div>}

      {reportData && (
        <div className='report-section'>
          <div className='report-header'>
            <h3>
              Звіт за період {formatDate(reportData.dateFrom)} –{' '}
              {formatDate(reportData.dateTo)}
            </h3>
          </div>
          <div className='table-wrapper'>
            <table className='gunp-report-table documents-report-table'>
              <thead>
                <tr>
                  <th>№ з/п</th>
                  <th>Категорії документів</th>
                  <th>Підрозділи апарату</th>
                  <th>Територіальні підрозділи</th>
                  <th className='documents-total-column'>Всього, шт.</th>
                </tr>
              </thead>
              <tbody>
                {reportData.rows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className='col-number'>{row.rowNumber}</td>
                    <td className='documents-category'>{row.category}</td>
                    <td className='col-count'>{row.apparatus}</td>
                    <td className='col-count'>{row.territorial}</td>
                    <td className='col-count documents-total-column'>
                      {row.total}
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}

export default DocumentsTab;
