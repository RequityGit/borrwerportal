-- =============================================================================
-- FIX: Repair loan_events table from incomplete prior creation
-- Run this BEFORE re-running Part 3
-- =============================================================================

-- Drop the broken loan_events table entirely (no real data in it)
-- Must drop triggers first since they prevent DELETE
DROP TRIGGER IF EXISTS trg_loan_events_no_update ON loan_events;
DROP TRIGGER IF EXISTS trg_loan_events_no_delete ON loan_events;
DROP TABLE IF EXISTS loan_events CASCADE;

-- Recreate properly with all columns
CREATE TABLE loan_events (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id          text NOT NULL REFERENCES servicing_loans(loan_id),
    event_type       loan_event_type NOT NULL,
    event_date       date NOT NULL,
    amount           numeric(15,2) NOT NULL,
    running_balance  numeric(15,2) NOT NULL,
    reference_id     uuid,
    note             text,
    created_by       uuid REFERENCES auth.users(id),
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loan_events_loan_date ON loan_events(loan_id, event_date);
CREATE INDEX idx_loan_events_type ON loan_events(event_type);
CREATE INDEX idx_loan_events_reference ON loan_events(reference_id) WHERE reference_id IS NOT NULL;

-- Recreate append-only triggers
CREATE OR REPLACE FUNCTION prevent_loan_event_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'loan_events is append-only. UPDATE and DELETE are forbidden.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_loan_events_no_update BEFORE UPDATE ON loan_events FOR EACH ROW EXECUTE FUNCTION prevent_loan_event_modification();
CREATE TRIGGER trg_loan_events_no_delete BEFORE DELETE ON loan_events FOR EACH ROW EXECUTE FUNCTION prevent_loan_event_modification();

ALTER TABLE loan_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS loan_events_admin_all ON loan_events;
CREATE POLICY loan_events_admin_all ON loan_events FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Done! Now run Part 3.
