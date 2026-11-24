export const ROW_NUMBER_PATH: string;

export function getFieldValue(
  record: Record<string, unknown>,
  path: string,
  rowIndex: number,
): string | number;

export function createReportWorkbook(
  columns: { path: string; label: string; header: string }[],
  records: Record<string, unknown>[],
): Promise<Blob>;
