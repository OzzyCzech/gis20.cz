-- One row per e-mail address. status 'no' means "not coming": answered so in the form, or switched later
-- through the answer link (cancelled_at is set then). Rows are never deleted.
CREATE TABLE IF NOT EXISTS registrations (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	email TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	phone TEXT NOT NULL DEFAULT '',
	note TEXT NOT NULL DEFAULT '',
	-- Accommodation, chosen by guests who come: 'arrange' = the organisers book it, 'self' = the guest sorts it out.
	-- NULL when unknown (not coming, or switched to coming through the answer link).
	lodging TEXT CHECK (lodging IN ('arrange', 'self')),
	status TEXT NOT NULL CHECK (status IN ('yes', 'no')),
	-- Personal link to change the answer (coming / not coming), sent in every confirmation e-mail.
	token TEXT NOT NULL UNIQUE,
	-- Read-only link to the attendance sheet; separate from `token`, so a forwarded sheet link can't cancel anyone.
	view_token TEXT UNIQUE,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	cancelled_at TEXT
);
