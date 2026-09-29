import type { Member, Payment } from '../types';
import { getCurrentISTDateString } from './dates';

const todayMs = new Date(getCurrentISTDateString() + 'T00:00:00Z').getTime();
const getDateOffset = (days: number) => {
  const d = new Date(todayMs + days * 24 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};
export const mockMembers: Member[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    phone: '+919876543210',
    email: 'rahul@example.com',
    join_date: '2026-08-15',
    current_due_date: '2026-10-15', // Due soon/active depending on today
    anchor_day: 15,
    plan_id: 'plan-1',
    is_frozen: false,
    has_trainer: true,
    trainer_name: 'Alex Coach',
    notes: 'Prefers morning sessions',
    created_at: '2026-08-15T10:00:00Z',
    updated_at: '2026-08-15T10:00:00Z',
    deleted_at: null,
    plan: { id: 'plan-1', name: '3 Months Pro', months: 3, price: 2500, created_at: '' }
  },
  {
    id: '2',
    name: 'Priya Singh',
    phone: '+919876543211',
    email: null,
    join_date: '2026-07-01',
    current_due_date: getDateOffset(-3), // Overdue by 3 days (offset 3)
    anchor_day: 1,
    plan_id: 'plan-2',
    is_frozen: false,
    has_trainer: false,
    trainer_name: null,
    notes: '',
    created_at: '2026-07-01T10:00:00Z',
    updated_at: '2026-07-01T10:00:00Z',
    deleted_at: null,
    plan: { id: 'plan-2', name: '1 Month Basic', months: 1, price: 1000, created_at: '' }
  },
  {
    id: '3',
    name: 'Amit Patel',
    phone: '+919876543212',
    email: 'amit@example.com',
    join_date: '2026-09-10',
    current_due_date: '2026-10-10', // Active
    anchor_day: 10,
    plan_id: 'plan-1',
    is_frozen: false,
    has_trainer: false,
    trainer_name: null,
    notes: '',
    created_at: '2026-09-10T10:00:00Z',
    updated_at: '2026-09-10T10:00:00Z',
    deleted_at: null,
    plan: { id: 'plan-1', name: '3 Months Pro', months: 3, price: 2500, created_at: '' }
  },
  {
    id: '4',
    name: 'Neha Gupta',
    phone: '+919876543213',
    email: null,
    join_date: '2026-01-20',
    current_due_date: '2027-01-20', // Active
    anchor_day: 20,
    plan_id: 'plan-3',
    is_frozen: true, // Frozen
    has_trainer: true,
    trainer_name: 'Sarah Coach',
    notes: 'Currently traveling',
    created_at: '2026-01-20T10:00:00Z',
    updated_at: '2026-01-20T10:00:00Z',
    deleted_at: null,
    plan: { id: 'plan-3', name: '1 Year Elite', months: 12, price: 8000, created_at: '' }
  },
  {
    id: '5',
    name: 'Vikram Verma',
    phone: '+919876543214',
    email: '',
    join_date: '2026-09-28', // Recent join
    current_due_date: getDateOffset(0), // Due today
    anchor_day: 28,
    plan_id: 'plan-2',
    is_frozen: false,
    has_trainer: true,
    trainer_name: 'Alex Coach',
    notes: '',
    created_at: '2026-09-28T10:00:00Z',
    updated_at: '2026-09-28T10:00:00Z',
    deleted_at: null,
    plan: { id: 'plan-2', name: '1 Month Basic', months: 1, price: 1000, created_at: '' }
  }
];

export const mockPayments: Payment[] = [
  {
    id: 'pay-1',
    member_id: '1',
    amount: 2500,
    trainer_fee: 500,
    method: 'upi',
    paid_on: '2026-08-15',
    covers_from: '2026-08-15',
    covers_to: '2026-10-15',
    note: null,
    created_at: '2026-08-15T10:00:00Z'
  },
  {
    id: 'pay-2',
    member_id: '5',
    amount: 1000,
    trainer_fee: 0,
    method: 'cash',
    paid_on: '2026-09-28',
    covers_from: '2026-09-28',
    covers_to: '2026-10-28',
    note: null,
    created_at: '2026-09-28T10:00:00Z'
  }
];
