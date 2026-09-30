-- Drop the existing UPDATE policy for members
DROP POLICY IF EXISTS "Admins can update members" ON members;

-- Create the new one restricting to owners only
CREATE POLICY "Only owners can update members" ON members
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'owner'
  );
