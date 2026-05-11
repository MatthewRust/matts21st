CREATE TABLE IF NOT EXISTS event_info (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS travel_arrangements (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  mode TEXT NOT NULL,
  departure_location TEXT,
  departure_time TIMESTAMPTZ,
  seats_available INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pictures (
  id SERIAL PRIMARY KEY,
  uploader_name TEXT,
  caption TEXT,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO event_info (title, body, display_order) VALUES
  ('When', 'Date and time TBD — update this row in the event_info table.', 1),
  ('Where', 'Venue and address TBD.', 2),
  ('Dress code', 'TBD.', 3)
ON CONFLICT DO NOTHING;
