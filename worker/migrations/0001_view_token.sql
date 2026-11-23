-- Attendance sheet link (prezenční listina): a read-only token per registration.
-- Run once on a database created before this column existed; schema.sql already has it.
ALTER TABLE registrations ADD COLUMN view_token TEXT;
UPDATE registrations SET view_token = lower(hex(randomblob(16))) WHERE view_token IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS registrations_view_token ON registrations (view_token);
