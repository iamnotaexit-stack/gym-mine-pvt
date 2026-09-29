export interface Plan {
  id: string;
  name: string;
  months: number;
  price: number;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  join_date: string;
  anchor_day: number;
  plan_id: string;
  current_due_date: string;
  is_frozen: boolean;
  has_trainer: boolean;
  trainer_name: string | null;
  notes: string | null;
  created_by: string;
  deleted_at: string | null;
  // Joined fields
  plan?: Plan;
  // Computed client-side
  next_due_date?: string;
  status?: 'active' | 'due_soon' | 'due' | 'overdue' | 'frozen';
  payments?: Payment[];
}

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  trainer_fee: number;
  method: 'cash' | 'upi' | 'other';
  paid_on: string;
  covers_from: string;
  covers_to: string;
  note: string | null;
  created_by: string;
}

