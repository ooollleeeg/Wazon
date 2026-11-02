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
type ComplianceKey =
  | 'certificates'
  | 'declarations'
  | 'completionActs'
  | 'authorizationNotices';

interface ReportRow {
  key: SourceKey;
  values: Record<Subdivision, Record<Category, number>>;
}

interface ReportData {
  rows: ReportRow[];
  attestedRows?: ReportRow[];
  equippedRows?: ReportRow[];
  complianceRows?: Array<{
    key: ComplianceKey;
    values: Record<Subdivision, Record<Category, number>>;
  }>;
}

const categories: Category[] = ['II', 'III', 'IV'];
const sourceLabels: Record<SourceKey, string> = {
  servicePremises:
    '- службових приміщень, призначених для оброблення мовної ІзОД',
  electronicComputers: "- об'єктів ЕОТ*, призначених для оброблення ІзОД",
  combined:
    '- комбінованих ОІД, де інформація обробляється в АС та озвучується',
  copyingEquipment: "- об'єктів КРТ, призначених для оброблення ІзОД",
};
const complianceLabels: Record<ComplianceKey, string> = {
  certificates:
    '- атестати відповідності, видані на підставі Експертних висновків',
  declarations:
    '- декларації про відповідність вимогам нормативних документів з ТЗІ',
  completionActs: '- акти про завершення робіт зі створення КСЗІ в АС',
  authorizationNotices:
    '- повідомлення про включення АС до переліку авторизованих систем з безпеки',
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

  const equippedRows = useMemo(() => {
    if (!report?.equippedRows) return [];
    return report.equippedRows.map((row) => {
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

  const complianceRows = useMemo(() => {
    if (!report?.complianceRows) return [];
    return report.complianceRows.map((row) => {
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

  const equippedTotalBySubdivision = (
    subdivision: Subdivision,
    category: Category,
  ) =>
    equippedRows.reduce(
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
    (total, category) =>
      total + attestedTotalBySubdivision('apparatus', category),
    0,
  );
  const attestedTerritorialGrandTotal = categories.reduce(
    (total, category) =>
      total + attestedTotalBySubdivision('territorial', category),
    0,
  );
  const equippedApparatusGrandTotal = categories.reduce(
    (total, category) =>
      total + equippedTotalBySubdivision('apparatus', category),
    0,
  );
  const equippedTerritorialGrandTotal = categories.reduce(
    (total, category) =>
      total + equippedTotalBySubdivision('territorial', category),
    0,
  );
  const complianceTotalBySubdivision = (
    subdivision: Subdivision,
    category: Category,
  ) =>
    complianceRows.reduce(
      (total, row) => total + row.values[subdivision][category],
      0,
    );
  const complianceApparatusGrandTotal = categories.reduce(
    (total, category) =>
      total + complianceTotalBySubdivision('apparatus', category),
    0,
  );
  const complianceTerritorialGrandTotal = categories.reduce(
    (total, category) =>
      total + complianceTotalBySubdivision('territorial', category),
    0,
  );

  return (
    <div className='oid-information-container'>
      <div className='oid-information-header'>
        <h2>Відомості про об'єкти інформаційної діяльності</h2>
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
            <tr className='oid-total-row'>
              <td>3. Кількість об'єктів, які обладнані засобами ТЗІ</td>
              {categories.map((category) => (
                <td key={`equipped-a-total-${category}`}>
                  {equippedTotalBySubdivision('apparatus', category)}
                </td>
              ))}
              <td>{equippedApparatusGrandTotal}</td>
              {categories.map((category) => (
                <td key={`equipped-t-total-${category}`}>
                  {equippedTotalBySubdivision('territorial', category)}
                </td>
              ))}
              <td>{equippedTerritorialGrandTotal}</td>
              <td>
                {equippedApparatusGrandTotal + equippedTerritorialGrandTotal}
              </td>
            </tr>
            {equippedRows.map((row) => (
              <tr key={`equipped-${row.key}`}>
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
              <td>4. Кількість автоматизованих систем, які мають чинні</td>
              {categories.map((category) => (
                <td key={`compliance-a-total-${category}`}>
                  {complianceTotalBySubdivision('apparatus', category)}
                </td>
              ))}
              <td>{complianceApparatusGrandTotal}</td>
              {categories.map((category) => (
                <td key={`compliance-t-total-${category}`}>
                  {complianceTotalBySubdivision('territorial', category)}
                </td>
              ))}
              <td>{complianceTerritorialGrandTotal}</td>
              <td>
                {complianceApparatusGrandTotal +
                  complianceTerritorialGrandTotal}
              </td>
            </tr>
            {complianceRows.map((row) => (
              <tr key={`compliance-${row.key}`}>
                <td>{complianceLabels[row.key]}</td>
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
      <div className='oid-information-futer'>
        <h4>*В цій таблиці АС IV категорії підраховуються як окремі об'єкти</h4>
      </div>
    </div>
  );
}

export default OidInformationTab;
