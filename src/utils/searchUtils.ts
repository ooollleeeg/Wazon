import React from 'react';

/**
 * Рекурсивно шукає термін у всіх полях об'єкта (включаючи вложені)
 * @param obj - об'єкт для пошуку
 * @param searchTerm - термін пошуку
 * @returns true якщо термін знайдений
 */
export function searchInObject(obj: any, searchTerm: string): boolean {
  if (!searchTerm || !obj) return true;

  const term = searchTerm.toLowerCase();

  // Функція для форматування дати в український формат
  const formatDateForSearch = (date: any): string => {
    if (!date) return '';

    try {
      // Якщо це строка в форматі ISO (YYYY-MM-DD), отримуємо її як-є
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-');
        // Повертаємо обидва формати для пошуку
        return `${date} ${day}.${month}.${year}`;
      }

      // Якщо це Date об'єкт
      if (date instanceof Date) {
        const dateStr = date.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-');
        return `${dateStr} ${day}.${month}.${year}`;
      }

      return '';
    } catch {
      return '';
    }
  };

  // Рекурсивна функція для пошуку у всіх значеннях
  function search(value: any): boolean {
    // Примітивни типи
    if (typeof value === 'string') {
      // Перевіряємо чи це дата в ISO форматі
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return formatDateForSearch(value).toLowerCase().includes(term);
      }
      return value.toLowerCase().includes(term);
    }
    if (typeof value === 'number') {
      return value.toString().includes(term);
    }

    // Дата об'єкт
    if (value instanceof Date) {
      return formatDateForSearch(value).toLowerCase().includes(term);
    }

    // Array
    if (Array.isArray(value)) {
      return value.some((item) => search(item));
    }

    // Object
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some((val) => search(val));
    }

    return false;
  }

  return search(obj);
}

/**
 * Підсвічує текст який співпадає з searchTerm
 * @param text - текст для підсвічення
 * @param searchTerm - термін пошуку
 * @returns React element з підсвіченим текстом
 */
export function highlightText(
  text: string,
  searchTerm: string,
): React.ReactNode {
  if (!searchTerm || !text) return text;

  const term = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();

  // Перевіряємо типи дат
  const isUkrainianDate = /^\d{2}\.\d{2}\.\d{4}$/.test(text.trim()); // DD.MM.YYYY
  const isYearOnly = /^\d{4}$/.test(text.trim()); // YYYY

  // ============= ОБРОБКА УКРАЇНСЬКИХ ДАТ (DD.MM.YYYY) =============
  if (isUkrainianDate) {
    const [day, month, year] = text.trim().split('.');
    const isoDate = `${year}-${month}-${day}`;

    // Перевіряємо чи знайдено збіг
    const hasMatch =
      term === text.trim() || // точна рівність
      term === isoDate || // ISO формат
      day.includes(term) ||
      month.includes(term) ||
      year.includes(term) ||
      isoDate.toLowerCase().includes(term);

    if (!hasMatch) {
      return text;
    }

    // Якщо шукаємо повну дату
    if (term === text.trim() || term === isoDate) {
      return React.createElement(
        React.Fragment,
        null,
        React.createElement('mark', { style: highlightStyle }, text),
      );
    }

    // Підсвічуємо окремі частини дати
    const parts: React.ReactNode[] = [];
    if (day.includes(term)) {
      parts.push(React.createElement('mark', { style: highlightStyle }, day));
    } else {
      parts.push(day);
    }
    parts.push('.');
    if (month.includes(term)) {
      parts.push(React.createElement('mark', { style: highlightStyle }, month));
    } else {
      parts.push(month);
    }
    parts.push('.');
    if (year.includes(term)) {
      parts.push(React.createElement('mark', { style: highlightStyle }, year));
    } else {
      parts.push(year);
    }

    return React.createElement(React.Fragment, null, ...parts);
  }

  // ============= ОБРОБКА ЛИШЕ РОКІВ (YYYY) =============
  if (isYearOnly) {
    if (textLower.includes(term)) {
      return React.createElement(
        React.Fragment,
        null,
        React.createElement('mark', { style: highlightStyle }, text),
      );
    }
    return text;
  }

  // ============= ОБРОБКА ЗВИЧАЙНОГО ТЕКСТУ =============
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  let index = textLower.indexOf(term);
  while (index !== -1) {
    // Додаємо текст до збігу
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }

    // Додаємо підсвічений текст
    parts.push(
      React.createElement(
        'mark',
        { key: `${index}-${lastIndex}`, style: highlightStyle },
        text.substring(index, index + term.length),
      ),
    );

    lastIndex = index + term.length;
    index = textLower.indexOf(term, lastIndex);
  }

  // Додаємо залишок тексту
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // Обертаємо в Fragment щоб запобігти додаванню пробілів
  return React.createElement(React.Fragment, null, ...parts);
}

/**
 * Стиль для підсвічення
 */
export const highlightStyle: React.CSSProperties = {
  backgroundColor: '#ffd700',
  fontWeight: 'bold',
  borderRadius: '2px',
  display: 'inline',
  margin: '0',
};
