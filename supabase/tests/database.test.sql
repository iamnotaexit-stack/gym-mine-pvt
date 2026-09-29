BEGIN;
SELECT plan(6);

-- Setup test users
-- Create dummy users in auth.users (abstracted via generic insert if available in tests, usually done via helper)
-- For the sake of the test, we'll set local config for role and assume policies use it.

-- Test 1: Subadmin cannot read payments
SET LOCAL ROLE authenticated;
-- Mock subadmin role for get_auth_role()
CREATE OR REPLACE FUNCTION get_auth_role() RETURNS user_role AS $$ SELECT 'subadmin'::user_role; $$ LANGUAGE sql;

SELECT throws_ok(
    $$ SELECT * FROM payments; $$,
    '42501',
    NULL,
    'Sub-admin should not be able to read payments'
);

-- Test 2: Subadmin cannot read settings
SELECT throws_ok(
    $$ SELECT * FROM settings; $$,
    '42501',
    NULL,
    'Sub-admin should not be able to read settings'
);

-- Test 3: Subadmin cannot hard-delete members
SELECT throws_ok(
    $$ DELETE FROM members WHERE id = '00000000-0000-0000-0000-000000000000'; $$,
    '42501',
    NULL,
    'Sub-admin should not be able to hard delete members'
);

-- Test 4: Owner CAN read payments
CREATE OR REPLACE FUNCTION get_auth_role() RETURNS user_role AS $$ SELECT 'owner'::user_role; $$ LANGUAGE sql;
SELECT lives_ok(
    $$ SELECT * FROM payments; $$,
    'Owner should be able to read payments'
);

-- Test 5: Owner CAN read settings
SELECT lives_ok(
    $$ SELECT * FROM settings; $$,
    'Owner should be able to read settings'
);

-- Test 6: Owner CAN hard-delete members
SELECT lives_ok(
    $$ DELETE FROM members WHERE id = '00000000-0000-0000-0000-000000000000'; $$,
    'Owner should be able to hard delete members'
);

SELECT * FROM finish();
ROLLBACK;
