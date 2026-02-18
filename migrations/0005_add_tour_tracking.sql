-- Create tour_tracking table to track which tours users have completed
CREATE TABLE IF NOT EXISTS tour_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dashboard_tour_done BOOLEAN DEFAULT FALSE,
  notes_tour_done BOOLEAN DEFAULT FALSE,
  events_tour_done BOOLEAN DEFAULT FALSE,
  studentmart_tour_done BOOLEAN DEFAULT FALSE,
  chatroom_tour_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tour_tracking_user_id ON tour_tracking(user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tour_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tour_tracking_update_timestamp
BEFORE UPDATE ON tour_tracking
FOR EACH ROW
EXECUTE FUNCTION update_tour_tracking_timestamp();
