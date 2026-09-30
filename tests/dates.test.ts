import { describe, it, expect } from 'vitest';
import { calculateNextDueDate, computeMemberStatus } from '../src/lib/dates';

describe('Gym Logic', () => {
  it('calculates next due date properly (no drift on month ends)', () => {
    // Member joins on Jan 31
    const nextDue = calculateNextDueDate(31, '2024-01-31', 1);
    expect(nextDue).toBe('2024-02-29'); // Leap year
    
    // Member joins Feb 15
    const nextDue2 = calculateNextDueDate(15, '2024-02-15', 1);
    expect(nextDue2).toBe('2024-03-15');
  });

  it('computes member status correctly', () => {
    const today = new Date('2024-03-15T12:00:00Z'); // Fixed test date
    
    // Paid (due in future)
    expect(computeMemberStatus('2024-04-15', false, 3, today)).toBe('active');
    
    // Overdue (due 5 days ago, grace period 3)
    expect(computeMemberStatus('2024-03-10', false, 3, today)).toBe('overdue');
    
    // Due (within grace period)
    expect(computeMemberStatus('2024-03-14', false, 3, today)).toBe('due');
    
    // Due soon (within 7 days)
    expect(computeMemberStatus('2024-03-20', false, 3, today)).toBe('due_soon');
  });
});
