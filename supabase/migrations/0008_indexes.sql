-- Add indexes to improve lookup and stats performance
CREATE INDEX IF NOT EXISTS members_deleted_at_idx ON members (deleted_at);
CREATE INDEX IF NOT EXISTS members_is_frozen_idx ON members (is_frozen);
CREATE INDEX IF NOT EXISTS members_current_due_date_idx ON members (current_due_date);
CREATE INDEX IF NOT EXISTS payments_paid_on_idx ON payments (paid_on);
CREATE INDEX IF NOT EXISTS payments_member_id_idx ON payments (member_id);
