import React, { useState } from 'react';
import '../../styles/TabContent.css';
import '../../styles/GUNPResearchTab.css';

interface ReportRow {
  rowNumber: number;
  eventDate: string;
  subdivisionName: string;
  performer: string;
  sp_instrumental: number;
  as_special_research: number;
  as_instrumental: number;
  krt_instrumental: number;
  as_special_check: number;
}

interface ReportData {
  success: boolean;
  dateFrom: string;
  dateTo: string;
  rows: ReportRow[];
  totals: ReportRow;
}

function GUNPResearchTab() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Валідація дати в форматі YYYY-MM-DD
  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    // Date input повертає дату в форматі YYYY-MM-DD
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
        `/api/gunp-research-report?dateFrom=${dateFrom}&dateTo=${dateTo}`,
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

  return (
    <div className='gunp-research-container'>
      <div className='gunp-header'>
        <h2>🔬 Дослідження ГУНП</h2>
      </div>

      <div className='gunp-description'>
        <p>
          Для формування звіту щодо кількісних показників інструментальних
          досліджень на власних ОІД, оберіть, будь ласка, відповідний період
          часу.{' '}
        </p>
      </div>

      <div className='gunp-controls'>
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
      </div>

      {error && <div className='error-message'>{error}</div>}

      {reportData && (
        <div className='report-section'>
          <div className='report-header'>
            <h3>
              Звіт про інструментальні дослідження ГУНП за період{' '}
              {formatDate(dateFrom)} – {formatDate(dateTo)}
            </h3>
            <p className='report-count'>
              Знайдено: {reportData.rows.length} записів
            </p>
          </div>

          <div className='table-wrapper'>
            <table className='gunp-report-table'>
              <thead>
                <tr>
                  <th className='col-number'>№ з/п</th>
                  <th className='col-date'>Дата проведення робіт</th>
                  <th className='col-subdivision'>Назва підрозділу</th>
                  <th className='col-performer'>Організація-виконавець</th>
                  <th className='col-count'>Інструментальні контролі СП</th>
                  <th className='col-count'>Спеціальні дослідження ПЕОМ</th>
                  <th className='col-count'>Інструментальні контролі ПЕОМ</th>
                  <th className='col-count'>Інструментальні контролі КРТ</th>
                  <th className='col-count'>КСП</th>
                </tr>
              </thead>
              <tbody>
                {reportData.rows.map((row) => (
                  <tr
                    key={`${row.eventDate}-${row.subdivisionName}-${row.performer}`}
                  >
                    <td className='col-number'>{row.rowNumber}</td>
                    <td className='col-date'>{formatDate(row.eventDate)}</td>
                    <td className='col-subdivision'>{row.subdivisionName}</td>
                    <td className='col-performer'>{row.performer}</td>
                    <td className='col-count'>{row.sp_instrumental}</td>
                    <td className='col-count'>{row.as_special_research}</td>
                    <td className='col-count'>{row.as_instrumental}</td>
                    <td className='col-count'>{row.krt_instrumental}</td>
                    <td className='col-count'>{row.as_special_check}</td>
                  </tr>
                ))}
                <tr className='totals-row'>
                  <td className='col-number'>{reportData.totals.rowNumber}</td>
                  <td className='col-date'>{reportData.totals.eventDate}</td>
                  <td colSpan={2} className='totals-label'>
                    ПІДСУМОК
                  </td>
                  <td className='col-count'>
                    {reportData.totals.sp_instrumental}
                  </td>
                  <td className='col-count'>
                    {reportData.totals.as_special_research}
                  </td>
                  <td className='col-count'>
                    {reportData.totals.as_instrumental}
                  </td>
                  <td className='col-count'>
                    {reportData.totals.krt_instrumental}
                  </td>
                  <td className='col-count'>
                    {reportData.totals.as_special_check}
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
    </div>
  );
}

export default GUNPResearchTab;
