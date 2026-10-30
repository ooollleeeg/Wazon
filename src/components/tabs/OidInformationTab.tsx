import { useEffect, useMemo, useState } from 'react';
import '../../styles/TabContent.css';
import '../../styles/OidInformationTab.css';

type Category = 'II' | 'III' | 'IV';
type Subdivision = 'apparatus' | 'territorial';
type SourceKey =
  | 'servicePremises'
  | 'electronicComputers'
  | 'combined'
  | 'copyingEquipment';

interface ReportRow {
  key: SourceKey;
  values: Record<Subdivision, Record<Category, number>>;
}

interface ReportData {
  rows: ReportRow[];
  attestedRows?: ReportRow[];
}

const categories: Category[] = ['II', 'III', 'IV'];
const sourceLabels: Record<SourceKey, string> = {
  servicePremises:
    '- службових приміщень, призначених для оброблення мовної ІзОД',
  electronicComputers: "- об'єктів ЕОТ, призначених для оброблення ІзОД",
  combined:
    '- комбінованих ОІД, де інформація обробляється в АС та озвучується',
  copyingEquipment: "- об'єктів КРТ, призначених для оброблення ІзОД",
};

const getTotal = (values: Record<Category, number>) =>
  categories.reduce((total, category) => total + values[category], 0);

function OidInformationTab() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReport = async () => {
      try {
        const response = await fetch('/api/oid-report');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setReport(await response.json());
      } catch (err) {
        console.error('Помилка завантаження відомостей про ОІД:', err);
        setError('Не вдалося завантажити відомості про ОІД. Спробуйте ще раз.');
      } finally {
        setLoading(false);
      }
    };
    void loadReport();
  }, []);

  const rows = useMemo(() => {
    if (!report) return [];
    return report.rows.map((row) => {
      const apparatusTotal = getTotal(row.values.apparatus);
      const territorialTotal = getTotal(row.values.territorial);
      return {
        ...row,
        apparatusTotal,
        territorialTotal,
        total: apparatusTotal + territorialTotal,
      };
    });
  }, [report]);

  const attestedRows = useMemo(() => {
    if (!report?.attestedRows) return [];
    return report.attestedRows.map((row) => {
      const apparatusTotal = getTotal(row.values.apparatus);
      const territorialTotal = getTotal(row.values.territorial);
      return {
        ...row,
        apparatusTotal,
        territorialTotal,
        total: apparatusTotal + territorialTotal,
      };
    });
  }, [report]);

  const totalBySubdivision = (subdivision: Subdivision, category: Category) =>
    rows.reduce((total, row) => total + row.values[subdivision][category], 0);

  const attestedTotalBySubdivision = (
    subdivision: Subdivision,
    category: Category,
  ) =>
    attestedRows.reduce(
      (total, row) => total + row.values[subdivision][category],
      0,
    );

  const renderCategoryCells = (
    values: Record<Category, number>,
    total: number,
  ) => (
    <>
      {categories.map((category) => (
        <td key={category}>{values[category]}</td>
      ))}
      <td className='oid-total-cell'>{total}</td>
    </>
  );

  if (loading) {
    return (
      <div className='oid-information-state'>Завантаження відомостей...</div>
    );
  }

  if (error || !report) {
    return <div className='oid-information-error'>{error}</div>;
  }

  const apparatusGrandTotal = categories.reduce(
    (total, category) => total + totalBySubdivision('apparatus', category),
    0,
  );
  const territorialGrandTotal = categories.reduce(
    (total, category) => total + totalBySubdivision('territorial', category),
    0,
  );
  const attestedApparatusGrandTotal = categories.reduce(
    (total, category) => total + attestedTotalBySubdivision('apparatus', category),
    0,
  );
  const attestedTerritorialGrandTotal = categories.reduce(
    (total, category) =>
      total + attestedTotalBySubdivision('territorial', category),
    0,
  );

  return (
    <div className='oid-information-container'>
      <div className='oid-information-header'>
        <h2>Відомості про об'єктах інформаційної діяльності</h2>
      </div>
      <div className='oid-table-wrapper'>
        <table className='oid-information-table'>
          <thead>
            <tr>
              <th rowSpan={3}>Зміст відомостей</th>
              <th colSpan={4}>Підрозділи апарату</th>
              <th colSpan={4}>Територіальні підрозділи</th>
              <th rowSpan={3}>Загальна кількість</th>
            </tr>
            <tr>
              <th colSpan={4}>кількість об'єктів по категоріям</th>
              <th colSpan={4}>кількість об'єктів по категоріям</th>
            </tr>
            <tr>
              {categories.map((category) => (
                <th key={`a-${category}`}>{category}</th>
              ))}
              <th>всього по апарату</th>
              {categories.map((category) => (
                <th key={`t-${category}`}>{category}</th>
              ))}
              <th>всього по підрозділах</th>
            </tr>
          </thead>
          <tbody>
            <tr className='oid-total-row'>
              <td>1. Загальна кількість об'єктів, у тому числі</td>
              {categories.map((category) => (
                <td key={`a-total-${category}`}>
                  {totalBySubdivision('apparatus', category)}
                </td>
              ))}
              <td>{apparatusGrandTotal}</td>
              {categories.map((category) => (
                <td key={`t-total-${category}`}>
                  {totalBySubdivision('territorial', category)}
                </td>
              ))}
              <td>{territorialGrandTotal}</td>
              <td>{apparatusGrandTotal + territorialGrandTotal}</td>
            </tr>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{sourceLabels[row.key]}</td>
                {renderCategoryCells(row.values.apparatus, row.apparatusTotal)}
                {renderCategoryCells(
                  row.values.territorial,
                  row.territorialTotal,
                )}
                <td className='oid-total-cell'>{row.total}</td>
              </tr>
            ))}
            <tr className='oid-total-row'>
              <td>2. Кількість атестованих об'єктів, у тому числі</td>
              {categories.map((category) => (
                <td key={`attested-a-total-${category}`}>
                  {attestedTotalBySubdivision('apparatus', category)}
                </td>
              ))}
              <td>{attestedApparatusGrandTotal}</td>
              {categories.map((category) => (
                <td key={`attested-t-total-${category}`}>
                  {attestedTotalBySubdivision('territorial', category)}
                </td>
              ))}
              <td>{attestedTerritorialGrandTotal}</td>
              <td>
                {attestedApparatusGrandTotal + attestedTerritorialGrandTotal}
              </td>
            </tr>
            {attestedRows.map((row) => (
              <tr key={`attested-${row.key}`}>
                <td>{sourceLabels[row.key]}</td>
                {renderCategoryCells(row.values.apparatus, row.apparatusTotal)}
                {renderCategoryCells(
                  row.values.territorial,
                  row.territorialTotal,
                )}
                <td className='oid-total-cell'>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OidInformationTab;
