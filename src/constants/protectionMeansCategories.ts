/**
 * Категорії засобів ТЗІ з ID для перевірки дублювання
 */
export const PROTECTION_MEANS_CATEGORIES = [
  {
    id: 1,
    name: 'Генератор радіочастотного зашумлення',
  },
  {
    id: 2,
    name: 'Фільтр електроживлення',
  },
  {
    id: 3,
    name: 'Мережевий трансформатор',
  },
  {
    id: 4,
    name: 'Генератор акустичного зашумлення',
  },
  {
    id: 5,
    name: 'Віброперетворювач',
  },
  {
    id: 6,
    name: 'Акустичний випромінювач',
  },
  {
    id: 7,
    name: 'Виріб типу "SRC-300"',
  },
  {
    id: 8,
    name: 'КЗЗ від НСД',
  },
  {
    id: 9,
    name: 'Інші вироби',
  },
] as const;

/**
 * Отримати ID категорії за назвою
 */
export const getCategoryId = (categoryName: string): number | null => {
  const category = PROTECTION_MEANS_CATEGORIES.find(
    (c) => c.name === categoryName,
  );
  return category?.id || null;
};

/**
 * Отримати назву категорії за ID
 */
export const getCategoryName = (categoryId: number): string | null => {
  const category = PROTECTION_MEANS_CATEGORIES.find((c) => c.id === categoryId);
  return category?.name || null;
};
