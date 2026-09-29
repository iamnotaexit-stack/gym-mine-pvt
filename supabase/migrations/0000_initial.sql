-- Enable pgcrypto for UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum for roles
CREATE TYPE user_role AS ENUM ('owner', 'subadmin');

-- profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  name TEXT NOT NULL
);

-- plans table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  months INTEGER NOT NULL,
  price INTEGER NOT NULL
);

-- members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  join_date DATE NOT NULL,
  anchor_day INTEGER NOT NULL CHECK (anchor_day BETWEEN 1 AND 31),
  plan_id UUID NOT NULL REFERENCES plans(id),
  has_trainer BOOLEAN NOT NULL DEFAULT false,
  trainer_name TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- note: computed on read client side, but schema implies storing or not? The prompt said "status computed on read in IST, never stored". So remove status.
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Correcting members table based on prompt: "status computed on read in IST, never stored."
ALTER TABLE members DROP COLUMN status;

-- payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  trainer_fee INTEGER NOT NULL DEFAULT 0,
  method TEXT NOT NULL,
  paid_on DATE NOT NULL,
  covers_from DATE NOT NULL,
  covers_to DATE NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- reminder_log table
CREATE TABLE reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  kind TEXT NOT NULL,
  channel TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(member_id, due_date, kind, channel)
);

-- settings table (single row)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_name TEXT NOT NULL DEFAULT 'FitPro Gym',
  grace_days INTEGER NOT NULL DEFAULT 3,
  reminder_offsets JSONB NOT NULL DEFAULT '[-3, 0, 1, 3, 7]'::jsonb,
  group_url_general TEXT,
  group_url_trainer TEXT,
  templates JSONB NOT NULL DEFAULT '{"due_soon": "Hi {name}, your gym fee is due on {date}.", "overdue": "Hi {name}, your gym fee was due on {date}."}'::jsonb
);

-- Ensure only one row in settings
CREATE UNIQUE INDEX settings_single_row ON settings ((true));

-- audit_log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  meta JSONB
);

-- Row Level Security (RLS)

-- Turn on RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create helper function to get current user role
CREATE OR REPLACE FUNCTION get_auth_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Users can read their own profile. Owner can read all.
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Owner can read all profiles" ON profiles
  FOR SELECT USING (get_auth_role() = 'owner');

CREATE POLICY "Owner can insert profiles" ON profiles
  FOR INSERT WITH CHECK (get_auth_role() = 'owner');

CREATE POLICY "Owner can update profiles" ON profiles
  FOR UPDATE USING (get_auth_role() = 'owner');

-- Plans: Anyone authenticated can read. Owner can modify.
CREATE POLICY "Anyone authenticated can read plans" ON plans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owner can modify plans" ON plans
  FOR ALL USING (get_auth_role() = 'owner');

-- Members: Subadmin and owner can read, insert, update (for soft delete).
-- Note: Subadmins cannot hard delete, but soft delete is just an update.
CREATE POLICY "Anyone authenticated can read members" ON members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone authenticated can insert members" ON members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Anyone authenticated can update members" ON members
  FOR UPDATE USING (auth.role() = 'authenticated');
  
-- Only owner can hard delete members
CREATE POLICY "Owner can hard delete members" ON members
  FOR DELETE USING (get_auth_role() = 'owner');

-- Payments: Only owner can access
CREATE POLICY "Owner can access payments" ON payments
  FOR ALL USING (get_auth_role() = 'owner');

-- Reminder log: Owner can access all
CREATE POLICY "Owner can access reminder log" ON reminder_log
  FOR ALL USING (get_auth_role() = 'owner');

-- Settings: Only owner can access
CREATE POLICY "Owner can access settings" ON settings
  FOR ALL USING (get_auth_role() = 'owner');

-- Audit Log: Only owner can access
CREATE POLICY "Owner can access audit log" ON audit_log
  FOR ALL USING (get_auth_role() = 'owner');
  
-- Insert initial settings row if it doesn't exist
INSERT INTO settings (gym_name) VALUES ('FitPro Gym') ON CONFLICT DO NOTHING;
