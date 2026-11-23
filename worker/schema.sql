-- One row per e-mail address. status 'no' means "not coming": answered so in the form, or cancelled later
-- (cancelled_at is set then). Rows are never deleted.
CREATE TABLE IF NOT EXISTS registrations (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	email TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	phone TEXT NOT NULL DEFAULT '',
	note TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL CHECK (status IN ('yes', 'no')),
	-- Personal cancel link from the confirmation e-mail.
	token TEXT NOT NULL UNIQUE,
	-- Read-only link to the attendance sheet; separate from `token`, so a forwarded sheet link can't cancel anyone.
	view_token TEXT UNIQUE,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL,
	cancelled_at TEXT
);
