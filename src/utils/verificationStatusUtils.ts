/**
 * Utility functions for verification expiration status tracking
 * Reused from ExpirationMonitoringTab logic
 */

export type VerificationStatus = 'expired' | 'critical' | 'warning' | 'ok';

export interface StatusResult {
  status: VerificationStatus;
  days: number;
}

/**
 * Calculate verification status based on validUntil date
 * Status categories:
 * - expired: Date has passed (days < 0)
 * - critical: Less than 7 days remaining
 * - warning: Less than 30 days remaining
 * - ok: More than 30 days remaining
 */
export const getVerificationStatus = (
  validUntilDate: string | Date | null,
): StatusResult => {
  if (!validUntilDate) return { status: 'ok', days: Infinity };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(validUntilDate);
  expDate.setHours(0, 0, 0, 0);

  const diffMs = expDate.getTime() - today.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) return { status: 'expired', days };
  if (days < 7) return { status: 'critical', days };
  if (days < 30) return { status: 'warning', days };
  return { status: 'ok', days };
};

/**
 * Get emoji icon for status
 */
export const getStatusIcon = (status: VerificationStatus): string => {
  switch (status) {
    case 'expired':
      return '⚫';
    case 'critical':
      return '🔴';
    case 'warning':
      return '🟡';
    case 'ok':
      return '🟢';
  }
};

/**
 * Get human-readable status label
 */
export const getStatusLabel = (status: VerificationStatus): string => {
  switch (status) {
    case 'expired':
      return 'Закінчилась';
    case 'critical':
      return 'Критично (до 7 днів)';
    case 'warning':
      return 'Скоро (до 30 днів)';
    case 'ok':
      return 'OK (більше 30 днів)';
  }
};

/**
 * Get correct Ukrainian grammatical form for "day/days"
 */
export const getUkrainianDayForm = (days: number): string => {
  const absDay = Math.abs(days);
  const remainder = absDay % 10;
  const remainder100 = absDay % 100;

  // Numbers 11-19 always use "днів"
  if (remainder100 >= 11 && remainder100 <= 19) {
    return 'днів';
  }

  switch (remainder) {
    case 1:
      return 'день';
    case 2:
    case 3:
    case 4:
      return 'дні';
    default:
      return 'днів';
  }
};

/**
 * Format days remaining as human-readable string
 * Example outputs:
 * - "25 днів" (future)
 * - "0 днів" (today)
 * - "5 днів тому" (past)
 */
export const formatDaysRemaining = (days: number): string => {
  if (days < 0) {
    return `${Math.abs(days)} ${getUkrainianDayForm(days)} тому`;
  }
  return `${days} ${getUkrainianDayForm(days)}`;
};

/**
 * Get CSS class name for status styling
 */
export const getStatusClassName = (status: VerificationStatus): string => {
  return `status-${status}`;
};

/**
 * ============================================
 * GROUP VERIFICATION FUNCTIONS
 * ============================================
 */

export interface Verification {
  id: number;
  deviceName: string;
  serialNumber: string;
  certificateRegNumber: string;
  verificationDate: string;
  validUntil: string;
  verificationCost: number;
}

export interface VerificationGroup {
  devicePart: string; // назва компоненту (deviceName)
  verifications: Verification[]; // всі свідоцтва цієї частини, відсортовані по даті (від найновіших)
  latest: Verification; // останнє свідоцтво (найновіше)
  latestStatus: VerificationStatus; // статус останнього
  isActive: boolean; // чи останнє свідоцтво ще чинне (не expired)
  archivedCount: number; // кількість архівних свідоцтв
}

/**
 * Розділяє свідоцтва за компонентами (deviceName)
 * З кожної групи вибирає останнє свідоцтво за verificationDate
 * Повертає вже відсортовані групи
 */
export function groupVerificationsByPart(
  verifications: Verification[] | undefined,
): VerificationGroup[] {
  if (!verifications || verifications.length === 0) return [];

  const groups = new Map<string, Verification[]>();

  // Групуємо за deviceName (назва компоненту)
  verifications.forEach((v) => {
    const part = v.deviceName || 'Невказано';
    if (!groups.has(part)) groups.set(part, []);
    groups.get(part)!.push(v);
  });

  // З кожної групи беремо останнє свідоцтво за датою
  const result = Array.from(groups).map(([part, verifs]) => {
    const sorted = [...verifs].sort(
      (a, b) =>
        new Date(b.verificationDate).getTime() -
        new Date(a.verificationDate).getTime(),
    );
    const latest = sorted[0];
    const latestStatus = getVerificationStatus(latest.validUntil).status;

    return {
      devicePart: part,
      verifications: sorted,
      latest: latest,
      latestStatus: latestStatus,
      isActive: latestStatus !== 'expired',
      archivedCount: sorted.length - 1,
    };
  });

  // Сортуємо групи за статусом (критичні першими)
  const statusOrder = { critical: 0, warning: 1, expired: 2, ok: 3 };
  result.sort(
    (a, b) => statusOrder[a.latestStatus] - statusOrder[b.latestStatus],
  );

  return result;
}

/**
 * Отримує ТІЛЬКИ останні свідоцтва для кожної частини
 * Використовується для таблиці та статистики
 */
export function getLatestVerificationsPerPart(
  verifications: Verification[] | undefined,
): Verification[] {
  return groupVerificationsByPart(verifications).map((g) => g.latest);
}

/**
 * Визначає статус техніки на основі ОСТАННІХ свідоцтв
 * Враховує найбільш критичний статус серед усіх компонентів
 * Повертає статус найменш сприятливого компонента
 */
export function getEquipmentVerificationStatus(
  verifications: Verification[] | undefined,
): StatusResult {
  if (!verifications || verifications.length === 0) {
    return { status: 'ok', days: Infinity };
  }

  const latest = getLatestVerificationsPerPart(verifications);
  const statuses = latest.map((v) => getVerificationStatus(v.validUntil));

  // Віднаходимо найменш сприятливий статус
  const statusPriority = { expired: 0, critical: 1, warning: 2, ok: 3 };
  const worst = statuses.reduce((a, b) =>
    statusPriority[a.status] < statusPriority[b.status] ? a : b,
  );

  return worst;
}

/**
 * Групує свідоцтва за роками для фільтрування у модалі
 */
export function groupVerificationsByYear(
  verifications: Verification[],
): Map<number, Verification[]> {
  const yearMap = new Map<number, Verification[]>();

  verifications.forEach((v) => {
    const year = new Date(v.verificationDate).getFullYear();
    if (!yearMap.has(year)) yearMap.set(year, []);
    yearMap.get(year)!.push(v);
  });

  // Сортуємо років від найновіших
  return new Map(Array.from(yearMap).sort((a, b) => b[0] - a[0]));
}

/**
 * Повертає роки, для яких є свідоцтва
 * Використовується для випадаючого списку фільтрування
 */
export function getVerificationYears(
  verifications: Verification[] | undefined,
): number[] {
  if (!verifications) return [];
  const years = new Set(
    verifications.map((v) => new Date(v.verificationDate).getFullYear()),
  );
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Визначає, чи свідоцтво старше 10 років
 * Використовується для автоматичного видалення
 */
export function isVerificationOlderThan10Years(
  verificationDate: string,
): boolean {
  const verDate = new Date(verificationDate);
  const today = new Date();
  const ageMs = today.getTime() - verDate.getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  return ageYears > 10;
}

/**
 * Фільтрує свідоцтва за роком
 */
export function filterVerificationsByYear(
  verifications: Verification[],
  year: number | null,
): Verification[] {
  if (!year) return verifications;
  return verifications.filter(
    (v) => new Date(v.verificationDate).getFullYear() === year,
  );
}
