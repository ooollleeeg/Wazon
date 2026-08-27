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
