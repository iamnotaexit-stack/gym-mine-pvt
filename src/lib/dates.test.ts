import { describe, it, expect } from 'vitest';
import { 
  getCurrentISTDateString, 
  calculateNextDueDate, 
  computeMemberStatus,
  calculateReminderDates
} from './dates';

describe('Dates Module', () => {
  describe('getCurrentISTDateString', () => {
    it('returns the correct IST date during UTC midnight', () => {
      // 00:00:00 UTC is 05:30:00 IST (same day)
      const mockDate = new Date('2024-01-15T00:00:00Z');
      expect(getCurrentISTDateString(mockDate)).toBe('2024-01-15');
    });

    it('returns the correct IST date just before UTC midnight', () => {
      // 23:00:00 UTC on Jan 14 is 04:30:00 IST on Jan 15
      const mockDate = new Date('2024-01-14T23:00:00Z');
      expect(getCurrentISTDateString(mockDate)).toBe('2024-01-15');
    });
  });

  describe('calculateNextDueDate', () => {
    it('handles standard month addition', () => {
      expect(calculateNextDueDate(15, '2024-01-15', 1)).toBe('2024-02-15');
      expect(calculateNextDueDate(15, '2024-01-15', 3)).toBe('2024-04-15');
    });

    it('clamps to the last day of short months', () => {
      expect(calculateNextDueDate(31, '2024-01-31', 1)).toBe('2024-02-29'); // Leap year
      expect(calculateNextDueDate(31, '2023-01-31', 1)).toBe('2023-02-28'); // Non-leap year
      expect(calculateNextDueDate(31, '2024-03-31', 1)).toBe('2024-04-30'); // April has 30 days
    });

    it('handles year rollovers', () => {
      expect(calculateNextDueDate(15, '2024-11-15', 2)).toBe('2025-01-15');
      expect(calculateNextDueDate(31, '2024-12-31', 2)).toBe('2025-02-28');
    });
    
    it('maintains original anchor day if possible after a clamped month', () => {
      // User joins Jan 31. Renews for 1 month -> Feb 29.
      // Next renewal from Feb 29 for 1 month using anchor 31 -> Mar 31.
      expect(calculateNextDueDate(31, '2024-02-29', 1)).toBe('2024-03-31');
    });
  });

  describe('computeMemberStatus', () => {
    it('returns frozen if frozen', () => {
      expect(computeMemberStatus('2024-01-15', true, 3, new Date('2024-01-10T00:00:00Z'))).toBe('frozen');
    });

    it('returns active if due date is far in the future', () => {
      // Due: Jan 20, Today: Jan 10
      expect(computeMemberStatus('2024-01-20', false, 3, new Date('2024-01-10T00:00:00Z'))).toBe('active');
    });

    it('returns due_soon if within 7 days', () => {
      // Due: Jan 15, Today: Jan 10
      expect(computeMemberStatus('2024-01-15', false, 3, new Date('2024-01-10T00:00:00Z'))).toBe('due_soon');
      // Due: Jan 15, Today: Jan 08
      expect(computeMemberStatus('2024-01-15', false, 3, new Date('2024-01-08T00:00:00Z'))).toBe('due_soon');
    });

    it('returns due on the exact day', () => {
      // Due: Jan 10, Today: Jan 10
      expect(computeMemberStatus('2024-01-10', false, 3, new Date('2024-01-10T00:00:00Z'))).toBe('due');
    });

    it('returns due if within grace period', () => {
      // Due: Jan 10, Today: Jan 12, Grace: 3 days
      expect(computeMemberStatus('2024-01-10', false, 3, new Date('2024-01-12T00:00:00Z'))).toBe('due');
    });

    it('returns overdue if past grace period', () => {
      // Due: Jan 10, Today: Jan 14, Grace: 3 days
      expect(computeMemberStatus('2024-01-10', false, 3, new Date('2024-01-14T00:00:00Z'))).toBe('overdue');
    });
  });

  describe('calculateReminderDates', () => {
    it('calculates the correct dates for the standard offsets', () => {
      const dates = calculateReminderDates('2024-01-15');
      expect(dates).toEqual([
        { offset: -3, date: '2024-01-12' },
        { offset: 0, date: '2024-01-15' },
        { offset: 1, date: '2024-01-16' },
        { offset: 3, date: '2024-01-18' },
        { offset: 7, date: '2024-01-22' },
      ]);
    });
    
    it('handles month boundaries', () => {
      const dates = calculateReminderDates('2024-03-02', [-3]);
      expect(dates).toEqual([
        { offset: -3, date: '2024-02-28' }, // 2024 is leap year
      ]);
    });
  });
});
