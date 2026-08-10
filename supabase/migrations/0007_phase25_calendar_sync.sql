-- Add google_event_id to curriculum_items if it doesn't exist
ALTER TABLE curriculum_items ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Create google_calendar_connections table
CREATE TABLE google_calendar_connections (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    google_account_email TEXT NOT NULL,
    target_calendar_id TEXT,
    sync_direction TEXT NOT NULL DEFAULT 'one-way',
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;

-- RLS for google_calendar_connections
-- Only the 'owner' can insert/update/delete the connection. 'co-owner' can view it.
CREATE POLICY "Owners have full access to calendar connections" 
    ON google_calendar_connections FOR ALL 
    USING (get_user_role() = 'owner');

CREATE POLICY "Co-owners can view calendar connections" 
    ON google_calendar_connections FOR SELECT 
    USING (get_user_role() = 'co-owner');

