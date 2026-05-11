-- Event info (static content managed in DB)
CREATE TABLE IF NOT EXISTS event_info (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users — created first so cars can reference driver_id
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  profile_pic_url VARCHAR NOT NULL DEFAULT 'default_pic.png',
  driver BOOLEAN NOT NULL DEFAULT FALSE,
  car_id INTEGER,                -- FK to cars; added via ALTER after cars table exists
  public_transport_id INTEGER,   -- nullable, for future public transport linking
  exp_arrival_date TIMESTAMPTZ,              -- optional; when they expect to arrive
  public_transport BOOLEAN NOT NULL DEFAULT FALSE, -- true if travelling by public transport
  ex_drinks     INTEGER,                      -- optional; how many drinks they plan to have
  daily_drinks  INTEGER NOT NULL DEFAULT 0,  -- resets to 0 at 23:59:59 each day
  total_drinks  INTEGER NOT NULL DEFAULT 0   -- cumulative all-time count
);

-- Cars — driver_id references users
CREATE TABLE IF NOT EXISTS cars (
  car_id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  max_num_passenger INTEGER NOT NULL,
  current_num_passenger INTEGER NOT NULL DEFAULT 0,
  description VARCHAR,
  departure_time TIMESTAMPTZ,
  departure_location VARCHAR
);

-- Close the circular ref: users.car_id → cars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_users_car_id'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_car_id
      FOREIGN KEY (car_id) REFERENCES cars(car_id) ON DELETE SET NULL;
  END IF;
END$$;

-- Pictures — uploader_id references users
CREATE TABLE IF NOT EXISTS pictures (
  picture_id SERIAL PRIMARY KEY,
  uploader_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  description VARCHAR,
  url VARCHAR NOT NULL,
  filename VARCHAR NOT NULL,
  upload_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed event info rows
INSERT INTO event_info (title, body, display_order) VALUES
  ('When', 'Date and time TBD — update this row in the event_info table.', 1),
  ('Where', 'Venue and address TBD.', 2),
  ('Dress code', 'TBD.', 3)
ON CONFLICT DO NOTHING;
