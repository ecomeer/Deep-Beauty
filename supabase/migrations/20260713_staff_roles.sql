-- Adds a 'staff' role with a granular permissions list, for admins who want
-- to give team members scoped access (e.g. only orders, only products)
-- instead of full admin rights.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'staff', 'customer'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT[] NOT NULL DEFAULT '{}';
