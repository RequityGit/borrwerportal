-- =============================================================================
-- LOAN SERVICING INFRASTRUCTURE - PART 0 (PREREQUISITE)
-- Base servicing tables that all other parts depend on
-- Run this FIRST before Part 1, 2, or 3
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. servicing_loans — The Loan Tape
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicing_loans (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id         text NOT NULL UNIQUE,
    borrower_name   text,
    entity_name     text,
    property_address text,
    city_state_zip  text,
    loan_type       text,
    loan_purpose    text,
    asset_class     text,
    program         text,
    loan_status     text NOT NULL DEFAULT 'Active',
    origination_date date,
    maturity_date   date,
    term_months     integer,
    total_loan_amount numeric(15,2) NOT NULL DEFAULT 0,
    construction_holdback numeric(15,2) DEFAULT 0,
    funds_released  numeric(15,2) DEFAULT 0,
    current_balance numeric(15,2) DEFAULT 0,
    draw_funds_available numeric(15,2) DEFAULT 0,
    interest_rate   numeric(8,6),
    monthly_payment numeric(15,2) DEFAULT 0,
    payment_type    text DEFAULT 'Interest Only',
    dutch_interest  boolean NOT NULL DEFAULT false,
    next_payment_due date,
    days_past_due   integer DEFAULT 0,
    fund_name       text,
    fund_ownership_pct numeric(8,6) DEFAULT 0,
    origination_fee numeric(15,2),
    exit_fee        numeric(15,2),
    purchase_price  numeric(15,2),
    origination_value numeric(15,2),
    stabilized_value numeric(15,2),
    additional_collateral_value numeric(15,2) DEFAULT 0,
    ltv_origination numeric(8,6),
    ltc             numeric(8,6),
    borrower_credit_score integer,
    originator      text,
    ach_status      text,
    routing_number  text,
    account_number  text,
    account_type    text,
    account_holder  text,
    folder_link     text,
    notes           text,
    default_rate    numeric(8,6),
    default_status  text,
    default_date    date,
    effective_rate  numeric(8,6),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicing_loans_status ON servicing_loans(loan_status);
CREATE INDEX IF NOT EXISTS idx_servicing_loans_loan_id ON servicing_loans(loan_id);
CREATE INDEX IF NOT EXISTS idx_servicing_loans_dutch ON servicing_loans(dutch_interest);

CREATE OR REPLACE FUNCTION update_servicing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_servicing_loans_updated_at ON servicing_loans;
CREATE TRIGGER trg_servicing_loans_updated_at
    BEFORE UPDATE ON servicing_loans
    FOR EACH ROW EXECUTE FUNCTION update_servicing_updated_at();


-- ---------------------------------------------------------------------------
-- 2. servicing_draws — The Draw Log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicing_draws (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_number     integer NOT NULL,
    loan_id         text NOT NULL REFERENCES servicing_loans(loan_id),
    request_date    date,
    entity_name     text,
    line_item       text,
    amount          numeric(15,2) NOT NULL DEFAULT 0,
    status          text NOT NULL DEFAULT 'Pending',
    funded_date     date,
    approved_by     text,
    inspection_complete text,
    reference_link  text,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicing_draws_loan_id ON servicing_draws(loan_id);
CREATE INDEX IF NOT EXISTS idx_servicing_draws_status ON servicing_draws(status);
CREATE INDEX IF NOT EXISTS idx_servicing_draws_funded_date ON servicing_draws(funded_date);

DROP TRIGGER IF EXISTS trg_servicing_draws_updated_at ON servicing_draws;
CREATE TRIGGER trg_servicing_draws_updated_at
    BEFORE UPDATE ON servicing_draws
    FOR EACH ROW EXECUTE FUNCTION update_servicing_updated_at();


-- ---------------------------------------------------------------------------
-- 3. servicing_payments — Payment Ledger (APPEND ONLY)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicing_payments (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date                date NOT NULL,
    loan_id             text NOT NULL REFERENCES servicing_loans(loan_id),
    borrower            text,
    type                text NOT NULL,
    amount_due          numeric(15,2) DEFAULT 0,
    amount_paid         numeric(15,2) DEFAULT 0,
    principal           numeric(15,2) DEFAULT 0,
    interest            numeric(15,2) DEFAULT 0,
    late_fee            numeric(15,2) DEFAULT 0,
    balance_after       numeric(15,2) DEFAULT 0,
    payment_method      text,
    reference_trace     text,
    entry_type          text NOT NULL DEFAULT 'Original',
    reversal_of         uuid REFERENCES servicing_payments(id),
    entered_by          text,
    entry_timestamp     timestamptz NOT NULL DEFAULT now(),
    locked              boolean NOT NULL DEFAULT false,
    running_balance_check numeric(15,2) DEFAULT 0,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicing_payments_loan_id ON servicing_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_servicing_payments_date ON servicing_payments(date);
CREATE INDEX IF NOT EXISTS idx_servicing_payments_entry_type ON servicing_payments(entry_type);


-- ---------------------------------------------------------------------------
-- 4. servicing_construction_budgets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicing_construction_budgets (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id         text NOT NULL REFERENCES servicing_loans(loan_id),
    line_item       text NOT NULL,
    budget_amount   numeric(15,2) DEFAULT 0,
    amount_drawn    numeric(15,2) DEFAULT 0,
    remaining       numeric(15,2) DEFAULT 0,
    pct_complete    numeric(8,6) DEFAULT 0,
    inspector_notes text,
    last_updated    timestamptz DEFAULT now(),
    status          text DEFAULT 'Open',
    inspection_link text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicing_budgets_loan_id ON servicing_construction_budgets(loan_id);

DROP TRIGGER IF EXISTS trg_servicing_budgets_updated_at ON servicing_construction_budgets;
CREATE TRIGGER trg_servicing_budgets_updated_at
    BEFORE UPDATE ON servicing_construction_budgets
    FOR EACH ROW EXECUTE FUNCTION update_servicing_updated_at();


-- ---------------------------------------------------------------------------
-- 5. servicing_pending_actions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicing_pending_actions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id         text NOT NULL REFERENCES servicing_loans(loan_id),
    entity_name     text,
    property        text,
    request_date    date,
    amount          numeric(15,2),
    request_type    text,
    action_status   text DEFAULT 'Pending',
    jotform_submitted boolean DEFAULT false,
    wire_date       date,
    wire_confirmation text,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicing_actions_loan_id ON servicing_pending_actions(loan_id);
CREATE INDEX IF NOT EXISTS idx_servicing_actions_status ON servicing_pending_actions(action_status);

DROP TRIGGER IF EXISTS trg_servicing_actions_updated_at ON servicing_pending_actions;
CREATE TRIGGER trg_servicing_actions_updated_at
    BEFORE UPDATE ON servicing_pending_actions
    FOR EACH ROW EXECUTE FUNCTION update_servicing_updated_at();


-- ---------------------------------------------------------------------------
-- 6. servicing_audit_log — IMMUTABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicing_audit_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp       timestamptz NOT NULL DEFAULT now(),
    user_email      text,
    action          text NOT NULL,
    loan_id         text,
    tab_source      text,
    field_changed   text,
    old_value       text,
    new_value       text,
    reference       text,
    entry_type      text DEFAULT 'System',
    notes           text
);

CREATE INDEX IF NOT EXISTS idx_servicing_audit_loan_id ON servicing_audit_log(loan_id);
CREATE INDEX IF NOT EXISTS idx_servicing_audit_timestamp ON servicing_audit_log(timestamp);


-- ---------------------------------------------------------------------------
-- 7. Enable RLS on all servicing tables
-- ---------------------------------------------------------------------------
ALTER TABLE servicing_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicing_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicing_construction_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicing_pending_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicing_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies — admin full access
DROP POLICY IF EXISTS servicing_loans_admin_all ON servicing_loans;
CREATE POLICY servicing_loans_admin_all ON servicing_loans FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS servicing_draws_admin_all ON servicing_draws;
CREATE POLICY servicing_draws_admin_all ON servicing_draws FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS servicing_payments_admin_all ON servicing_payments;
CREATE POLICY servicing_payments_admin_all ON servicing_payments FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS servicing_budgets_admin_all ON servicing_construction_budgets;
CREATE POLICY servicing_budgets_admin_all ON servicing_construction_budgets FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS servicing_actions_admin_all ON servicing_pending_actions;
CREATE POLICY servicing_actions_admin_all ON servicing_pending_actions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS servicing_audit_admin_all ON servicing_audit_log;
CREATE POLICY servicing_audit_admin_all ON servicing_audit_log FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- ===================== DONE =====================
-- Now run Part 1 (combined_part1_tables.sql)
