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

  // Рекурсивна функція для пошуку у всіх значеннях
  function search(value: any): boolean {
    // Примітивни типи
    if (typeof value === 'string') {
      return value.toLowerCase().includes(term);
    }
    if (typeof value === 'number') {
      return value.toString().includes(term);
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

  if (!textLower.includes(term)) {
    return text;
  }

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
