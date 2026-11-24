-- Accommodation choice on the RSVP slip (see `lodging` in schema.sql).
-- Run once on a database created before this column existed; schema.sql already has it.
ALTER TABLE registrations ADD COLUMN lodging TEXT CHECK (lodging IN ('arrange', 'self'));
