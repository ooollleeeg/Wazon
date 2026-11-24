const getValues = (value) => {
  if (Array.isArray(value)) return value.flatMap(getValues);
  if (value === null || value === undefined || value === '') return [];
  if (typeof value === 'object') return [];
  return [String(value)];
};

const getValuesAtPath = (value, segments) => {
  if (segments.length === 0) return getValues(value);
  if (Array.isArray(value)) {
    return value.flatMap((item) => getValuesAtPath(item, segments));
  }
  if (value && typeof value === 'object') {
    return getValuesAtPath(value[segments[0]], segments.slice(1));
  }
  return [];
};

/**
 * @param {Record<string, unknown>} record
 * @param {string} path
 * @param {number} rowIndex
 * @returns {string | number}
 */
export const getFieldValue = (record, path, rowIndex) =>
  path === ROW_NUMBER_PATH
    ? rowIndex + 1
    : getValuesAtPath(record, path.split('.')).join('; ');

/**
 * @param {{ path: string, label: string, header: string }[]} columns
 * @param {Record<string, unknown>[]} records
 * @returns {Promise<Blob>}
 */
export const createReportWorkbook = async (columns, records) => {
  const rows = [
    columns.map((column) => ({
      value: column.header || column.label,
      fontWeight: 'bold',
      align: 'center',
      alignVertical: 'center',
      wrap: true,
    })),
    ...records.map((record, rowIndex) =>
      columns.map((column) => ({
        value: getFieldValue(record, column.path, rowIndex),
        align: 'center',
        alignVertical: 'center',
        wrap: true,
      })),
    ),
  ];
  const widths = columns.map((_, columnIndex) => {
    let longestLine = 0;
    for (const row of rows) {
      for (const line of String(row[columnIndex].value).split(/\r\n|\r|\n/)) {
        longestLine = Math.max(longestLine, Array.from(line).length);
      }
    }
    return { width: Math.min(255, Math.max(8, Math.ceil(longestLine * 1.2) + 2)) };
  });
  const { default: writeExcelFile } = await import('write-excel-file/universal');
  return writeExcelFile(rows, { sheet: 'Звіт', columns: widths }).toBlob();
};
export const ROW_NUMBER_PATH = '@rowNumber';

