-- ============================================================
-- Contact Messages table
-- Public contact/feedback form submissions
-- ============================================================

CREATE TYPE contact_subject AS ENUM (
  'feedback',
  'suggestion',
  'candidate_inquiry',
  'other'
);

CREATE TABLE contact_messages (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  subject       contact_subject NOT NULL DEFAULT 'other',
  message       TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_messages_created ON contact_messages (created_at DESC);
CREATE INDEX idx_contact_messages_unread ON contact_messages (is_read) WHERE NOT is_read;

-- RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message
CREATE POLICY "Public insert: contact_messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

-- Only admin can read/manage messages
CREATE POLICY "Admin read: contact_messages" ON contact_messages
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin manage: contact_messages" ON contact_messages
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
