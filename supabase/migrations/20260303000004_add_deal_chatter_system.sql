-- =============================================================================
-- Deal Chatter System
-- Tables: deal_chat_channels, deal_chat_messages, deal_chat_read_status
-- Adds 'opportunity' to chat_entity_type enum
-- Integrates with main chat_channels for the Chatter page
-- =============================================================================

-- 1. Add 'opportunity' to chat_entity_type enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'chat_entity_type' AND e.enumlabel = 'opportunity'
  ) THEN
    ALTER TYPE chat_entity_type ADD VALUE 'opportunity';
  END IF;
END $$;

-- =============================================================================
-- 2. deal_chat_channels — one channel per deal/opportunity
-- =============================================================================
CREATE TABLE IF NOT EXISTS deal_chat_channels (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id       UUID NOT NULL,                       -- references either loans.id or opportunities.id
    channel_name  TEXT NOT NULL DEFAULT 'Deal Chatter',
    channel_type  TEXT NOT NULL DEFAULT 'deal',         -- 'deal' for now
    description   TEXT,
    is_archived   BOOLEAN NOT NULL DEFAULT false,
    last_message_at TIMESTAMPTZ,
    pinned_message_ids UUID[] DEFAULT '{}',
    metadata      JSONB DEFAULT '{}',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (loan_id)                                   -- one channel per deal
);

COMMENT ON TABLE deal_chat_channels IS 'Per-deal/opportunity chat channels for the Deal Chatter feature';
COMMENT ON COLUMN deal_chat_channels.loan_id IS 'References either loans.id or opportunities.id — the deal this channel belongs to';

-- =============================================================================
-- 3. deal_chat_messages — messages within a deal channel
-- =============================================================================
CREATE TABLE IF NOT EXISTS deal_chat_messages (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id        UUID NOT NULL REFERENCES deal_chat_channels(id) ON DELETE CASCADE,
    loan_id           UUID NOT NULL,                     -- denormalized for quick filtering
    sent_by           UUID NOT NULL REFERENCES auth.users(id),
    content           TEXT NOT NULL,
    content_html      TEXT,
    thread_parent_id  UUID REFERENCES deal_chat_messages(id) ON DELETE SET NULL,
    thread_reply_count INTEGER NOT NULL DEFAULT 0,
    thread_last_reply_at TIMESTAMPTZ,
    mentioned_user_ids UUID[] DEFAULT '{}',
    attachments       JSONB DEFAULT '[]',
    message_type      TEXT NOT NULL DEFAULT 'message',   -- message, system, email_notification
    is_pinned         BOOLEAN NOT NULL DEFAULT false,
    is_edited         BOOLEAN NOT NULL DEFAULT false,
    edited_at         TIMESTAMPTZ,
    is_deleted        BOOLEAN NOT NULL DEFAULT false,
    deleted_at        TIMESTAMPTZ,
    metadata          JSONB DEFAULT '{}',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE deal_chat_messages IS 'Messages within deal chatter channels';

-- =============================================================================
-- 4. deal_chat_read_status — per-user read tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS deal_chat_read_status (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id    UUID NOT NULL REFERENCES deal_chat_channels(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES auth.users(id),
    last_read_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    unread_count  INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (channel_id, user_id)
);

COMMENT ON TABLE deal_chat_read_status IS 'Tracks per-user read position in deal chatter channels';

-- =============================================================================
-- 5. Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_deal_chat_channels_loan ON deal_chat_channels(loan_id);
CREATE INDEX IF NOT EXISTS idx_deal_chat_channels_last_msg ON deal_chat_channels(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_chat_messages_channel ON deal_chat_messages(channel_id, created_at);
CREATE INDEX IF NOT EXISTS idx_deal_chat_messages_loan ON deal_chat_messages(loan_id);
CREATE INDEX IF NOT EXISTS idx_deal_chat_messages_sent_by ON deal_chat_messages(sent_by);
CREATE INDEX IF NOT EXISTS idx_deal_chat_messages_parent ON deal_chat_messages(thread_parent_id) WHERE thread_parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deal_chat_read_status_user ON deal_chat_read_status(user_id);

-- =============================================================================
-- 6. RLS Policies
-- =============================================================================
ALTER TABLE deal_chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_chat_read_status ENABLE ROW LEVEL SECURITY;

-- deal_chat_channels: admins full access
CREATE POLICY "deal_chat_channels_admin_select"
    ON deal_chat_channels FOR SELECT TO authenticated
    USING (is_admin());

CREATE POLICY "deal_chat_channels_admin_insert"
    ON deal_chat_channels FOR INSERT TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "deal_chat_channels_admin_update"
    ON deal_chat_channels FOR UPDATE TO authenticated
    USING (is_admin());

-- deal_chat_messages: admins full CRUD
CREATE POLICY "deal_chat_messages_admin_select"
    ON deal_chat_messages FOR SELECT TO authenticated
    USING (is_admin());

CREATE POLICY "deal_chat_messages_admin_insert"
    ON deal_chat_messages FOR INSERT TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "deal_chat_messages_admin_update"
    ON deal_chat_messages FOR UPDATE TO authenticated
    USING (is_admin());

CREATE POLICY "deal_chat_messages_admin_delete"
    ON deal_chat_messages FOR DELETE TO authenticated
    USING (is_admin());

-- deal_chat_read_status: users can manage their own read status
CREATE POLICY "deal_chat_read_status_own_select"
    ON deal_chat_read_status FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "deal_chat_read_status_own_insert"
    ON deal_chat_read_status FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "deal_chat_read_status_own_update"
    ON deal_chat_read_status FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- =============================================================================
-- 7. Triggers
-- =============================================================================

-- 7a. Auto-update updated_at on deal_chat_channels
CREATE OR REPLACE FUNCTION update_deal_chat_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_chat_channels_updated_at
    BEFORE UPDATE ON deal_chat_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_deal_chat_channels_updated_at();

-- 7b. Auto-update updated_at on deal_chat_messages
CREATE OR REPLACE FUNCTION update_deal_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_chat_messages_updated_at
    BEFORE UPDATE ON deal_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_deal_chat_messages_updated_at();

-- 7c. Update channel's last_message_at when a message is inserted
CREATE OR REPLACE FUNCTION update_deal_chat_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE deal_chat_channels
    SET last_message_at = NEW.created_at
    WHERE id = NEW.channel_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_chat_channel_last_message
    AFTER INSERT ON deal_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_deal_chat_channel_last_message();

-- 7d. Update thread_reply_count when a threaded reply is inserted
CREATE OR REPLACE FUNCTION update_deal_chat_thread_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.thread_parent_id IS NOT NULL THEN
        UPDATE deal_chat_messages
        SET thread_reply_count = thread_reply_count + 1,
            thread_last_reply_at = NEW.created_at
        WHERE id = NEW.thread_parent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_chat_thread_count
    AFTER INSERT ON deal_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_deal_chat_thread_count();

-- 7e. Increment unread_count for other users in the channel when a message is sent
CREATE OR REPLACE FUNCTION increment_deal_chat_unread()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE deal_chat_read_status
    SET unread_count = unread_count + 1,
        updated_at = now()
    WHERE channel_id = NEW.channel_id
      AND user_id != NEW.sent_by;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_chat_increment_unread
    AFTER INSERT ON deal_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION increment_deal_chat_unread();

-- 7f. Auto-create a chat_channels entry (for main Chatter page) when a deal_chat_channel is created
CREATE OR REPLACE FUNCTION sync_deal_chat_to_chat_channels()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create if one doesn't already exist for this entity
    IF NOT EXISTS (
        SELECT 1 FROM chat_channels
        WHERE linked_entity_type = 'opportunity'
          AND linked_entity_id = NEW.loan_id
    ) THEN
        INSERT INTO chat_channels (
            name,
            channel_type,
            linked_entity_type,
            linked_entity_id,
            is_private,
            auto_created,
            metadata
        ) VALUES (
            NEW.channel_name,
            'deal_room',
            'opportunity',
            NEW.loan_id,
            true,
            true,
            jsonb_build_object('deal_chat_channel_id', NEW.id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_deal_chat_to_chat_channels
    AFTER INSERT ON deal_chat_channels
    FOR EACH ROW
    EXECUTE FUNCTION sync_deal_chat_to_chat_channels();

-- =============================================================================
-- 8. Enable realtime for deal chat tables
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE deal_chat_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE deal_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE deal_chat_read_status;
