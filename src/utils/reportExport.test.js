import assert from 'node:assert/strict';
import { test } from 'node:test';
import { strFromU8, unzipSync } from 'fflate';
import { readSheet } from 'read-excel-file/node';
import { createReportWorkbook, ROW_NUMBER_PATH } from './reportExport.js';

test('numbers report rows sequentially independently of record IDs and column position', async () => {
  const columns = [
    { path: 'name', label: 'Назва', header: 'Назва' },
    { path: ROW_NUMBER_PATH, label: '№ з/п', header: '№ з/п' },
  ];
  const records = Array.from({ length: 8 }, (_, index) => ({
    id: 100 - index,
    name: `Запис ${index + 1}`,
  }));
  const workbook = await createReportWorkbook(columns, records);
  const rows = await readSheet(workbook);

  assert.deepEqual(rows[0], ['Назва', '№ з/п']);
  assert.deepEqual(rows.slice(1).map((row) => row[1]), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(rows.slice(1).map((row) => row[0]), records.map((record) => record.name));
});

test('sizes worksheet columns from the longest header or cell line', async () => {
  const columns = [
    { path: 'short', label: '№', header: '№' },
    { path: 'long', label: 'Назва підрозділу', header: 'Назва підрозділу' },
    { path: 'text', label: 'Текст', header: 'Текст' },
  ];
  const longName = 'Назва, довша за заголовок стовпчика';
  const veryLongText = 'А'.repeat(300);
  const workbook = await createReportWorkbook(columns, [
    { short: '1', long: longName, text: veryLongText },
    { short: '2', long: 'Коротко', text: 'Рядок 1\nРядок 2' },
  ]);
  const files = unzipSync(new Uint8Array(await workbook.arrayBuffer()));
  const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);
  const columnTags = [...sheet.matchAll(/<col\b[^>]*\/>/g)].map((match) => match[0]);
  const widths = columnTags.map((tag) => Number(tag.match(/\bwidth="([^"]+)"/)[1]));

  assert.equal(widths.length, 3);
  assert.ok(widths[0] < widths[1]);
  assert.ok(widths[1] >= longName.length);
  assert.equal(widths[2], 255);
  const rows = await readSheet(workbook);
  assert.equal(rows[1][2], veryLongText);
  assert.equal(rows[2][2], 'Рядок 1\nРядок 2');
});

test('exports Ukrainian report values and headers as Excel text cells', async () => {
  const columns = [
    { path: 'name', label: 'Назва', header: 'Підрозділ' },
    { path: 'items.name', label: 'Засоби', header: '' },
    { path: 'serial', label: 'Номер', header: 'Номер' },
    { path: 'note', label: 'Примітка', header: 'Примітка' },
  ];
  const records = [{
    name: 'Підрозділ № 1 «ТЗІ»',
    items: [{ name: 'Фільтр; 1' }, { name: 'Генератор "А"' }],
    serial: '000123',
    note: '=1+2',
  }, {
    name: 'Київ',
    items: [],
    serial: '0',
    note: 'Рядок 1\nРядок 2',
  }];

  const workbook = await createReportWorkbook(columns, records);
  const rows = await readSheet(workbook, { trim: false });

  assert.deepEqual(rows, [
    ['Підрозділ', 'Засоби', 'Номер', 'Примітка'],
    ['Підрозділ № 1 «ТЗІ»', 'Фільтр; 1; Генератор "А"', '000123', '=1+2'],
    ['Київ', null, '0', 'Рядок 1\nРядок 2'],
  ]);
});

test('centers worksheet cells and makes column headers bold', async () => {
  const columns = [
    { path: 'name', label: 'Назва', header: 'Назва' },
    { path: 'number', label: 'Номер', header: 'Номер' },
  ];
  const workbook = await createReportWorkbook(columns, [
    { name: 'Підрозділ', number: '123' },
  ]);
  const files = unzipSync(new Uint8Array(await workbook.arrayBuffer()));
  const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);
  const styles = strFromU8(files['xl/styles.xml']);
  const cellStyles = styles.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/)[1]
    .match(/<xf\b[^>]*>[\s\S]*?<\/xf>/g);
  const fonts = styles.match(/<fonts\b[^>]*>([\s\S]*?)<\/fonts>/)[1]
    .match(/<font>[\s\S]*?<\/font>/g);

  for (const cell of ['A1', 'B1', 'A2', 'B2']) {
    const styleIndex = Number(sheet.match(new RegExp(`<c r="${cell}" s="(\\d+)"`))[1]);
    const style = cellStyles[styleIndex];
    assert.match(style, /horizontal="center"/);
    assert.match(style, /vertical="center"/);
    const fontIndex = Number(style.match(/fontId="(\d+)"/)?.[1] || 0);
    if (cell.endsWith('1')) {
      assert.match(fonts[fontIndex], /<b\s*\/>/);
    } else {
      assert.doesNotMatch(fonts[fontIndex], /<b\s*\/>/);
    }
  }
});
