import { getCategoryId } from '../constants/protectionMeansCategories';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateAt?: {
    source: string;
    objectName: string;
    objectId: number;
  };
  error?: string;
}

/**
 * Перевірити дублікат засобу ТЗІ за допомогою API
 * Дублікат = categoryId + serialNumber обидва збігаються, S/N не порожній
 * @param categoryName Назва категорії (укр)
 * @param serialNumber Серійний номер
 * @returns Promise<DuplicateCheckResult>
 */
export const checkDuplicateProtectionMean = async (
  categoryName: string,
  serialNumber?: string,
): Promise<DuplicateCheckResult> => {
  try {
    // Get categoryId from category name
    const categoryId = getCategoryId(categoryName);
    if (!categoryId) {
      return {
        isDuplicate: false,
        error: `Невідома категорія: ${categoryName}`,
      };
    }

    // Empty serial number is never a duplicate
    if (!serialNumber || !serialNumber.trim()) {
      return { isDuplicate: false };
    }

    const response = await fetch('/api/protection-means/check-duplicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryId,
        serialNumber: serialNumber.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        isDuplicate: false,
        error: errorData.error || 'Помилка при перевірці дублів',
      };
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('❌ Error checking duplicate:', err);
    return {
      isDuplicate: false,
      error: err instanceof Error ? err.message : 'Невідома помилка',
    };
  }
};

/**
 * Валідація перед збереженням форми захисту засобів
 * @returns true if validation passed, false if duplicate found
 */
export const validateBeforeSave = async (
  categoryName: string,
  serialNumber?: string,
): Promise<{
  isValid: boolean;
  duplicateAt?: {
    source: string;
    objectName: string;
    objectId: number;
  };
}> => {
  const result = await checkDuplicateProtectionMean(categoryName, serialNumber);

  if (result.error) {
    console.warn('⚠️ Validation error:', result.error);
    return { isValid: true }; // Continue on validation errors
  }

  if (result.isDuplicate && result.duplicateAt) {
    return {
      isValid: false,
      duplicateAt: result.duplicateAt,
    };
  }

  return { isValid: true };
};
